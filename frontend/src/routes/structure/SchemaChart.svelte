<script lang="ts">
  import { onMount } from "svelte";
  import * as d3 from "d3";

  interface Field {
    name: string;
    type: string;
    required: boolean;
    pk?: boolean;
    fk?: string; // target collection name
  }

  interface Entity {
    id: string;
    label: string;
    fields: Field[];
    x: number;
    y: number;
    color: string;
    group: string;
  }

  interface Link {
    source: string;
    target: string;
    sourceField: string;
    label: string;
  }

  const COLORS = {
    auth: "#dbeafe",
    core: "#e0e7ff",
    league: "#d1fae5",
    scoring: "#fef3c7",
    playoff: "#fce7f3",
    finance: "#f3e8ff",
  };

  const entities: Entity[] = [
    {
      id: "users", label: "users", group: "auth", color: COLORS.auth,
      x: 50, y: 50,
      fields: [
        { name: "id", type: "text", required: true, pk: true },
        { name: "email", type: "email", required: true },
        { name: "name", type: "text", required: false },
        { name: "role", type: "select", required: true },
        { name: "avatar", type: "file", required: false },
        { name: "verified", type: "bool", required: false },
      ],
    },
    {
      id: "seasons", label: "seasons", group: "core", color: COLORS.core,
      x: 350, y: 50,
      fields: [
        { name: "id", type: "text", required: true, pk: true },
        { name: "year", type: "text", required: true },
        { name: "active", type: "bool", required: false },
      ],
    },
    {
      id: "courses", label: "courses", group: "core", color: COLORS.core,
      x: 650, y: 50,
      fields: [
        { name: "id", type: "text", required: true, pk: true },
        { name: "name", type: "text", required: true },
        { name: "baseHoleDistances", type: "json", required: true },
      ],
    },
    {
      id: "tournaments", label: "tournaments", group: "core", color: COLORS.core,
      x: 450, y: 280,
      fields: [
        { name: "id", type: "text", required: true, pk: true },
        { name: "name", type: "text", required: true },
        { name: "date", type: "date", required: true },
        { name: "course", type: "relation", required: true, fk: "courses" },
        { name: "seasonId", type: "relation", required: true, fk: "seasons" },
      ],
    },
    {
      id: "tournament_settings", label: "tournament_settings", group: "core", color: COLORS.core,
      x: 50, y: 280,
      fields: [
        { name: "id", type: "text", required: true, pk: true },
        { name: "tournament", type: "relation", required: false, fk: "tournaments" },
        { name: "startingHole", type: "number", required: true },
        { name: "intervalMinutes", type: "number", required: true },
        { name: "firstTeeTime", type: "text", required: true },
        { name: "format", type: "select", required: true },
        { name: "groupSize", type: "number", required: false },
        { name: "scoringModel", type: "select", required: false },
      ],
    },
    {
      id: "players", label: "players", group: "league", color: COLORS.league,
      x: 900, y: 50,
      fields: [
        { name: "id", type: "text", required: true, pk: true },
        { name: "name", type: "text", required: true },
        { name: "gender", type: "select", required: true },
        { name: "rating", type: "number", required: false },
        { name: "world_ranking", type: "number", required: false },
        { name: "active", type: "bool", required: false },
        { name: "is_reserve", type: "bool", required: false },
      ],
    },
    {
      id: "teams", label: "teams", group: "league", color: COLORS.league,
      x: 900, y: 330,
      fields: [
        { name: "id", type: "text", required: true, pk: true },
        { name: "name", type: "text", required: true },
        { name: "malePlayer", type: "relation", required: true, fk: "players" },
        { name: "femalePlayer", type: "relation", required: true, fk: "players" },
        { name: "team_earnings", type: "number", required: false },
        { name: "team_points", type: "number", required: false },
      ],
    },
    {
      id: "groups", label: "groups", group: "scoring", color: COLORS.scoring,
      x: 500, y: 530,
      fields: [
        { name: "id", type: "text", required: true, pk: true },
        { name: "tournament", type: "relation", required: true, fk: "tournaments" },
        { name: "team1", type: "relation", required: true, fk: "teams" },
        { name: "team2", type: "relation", required: true, fk: "teams" },
        { name: "teeTime", type: "text", required: false },
        { name: "startingHole", type: "number", required: false },
        { name: "groupNumber", type: "number", required: false },
        { name: "status", type: "select", required: false },
        { name: "stage", type: "select", required: false },
      ],
    },
    {
      id: "scores", label: "scores", group: "scoring", color: COLORS.scoring,
      x: 200, y: 730,
      fields: [
        { name: "id", type: "text", required: true, pk: true },
        { name: "group", type: "relation", required: true, fk: "groups" },
        { name: "player", type: "relation", required: true, fk: "players" },
        { name: "hole", type: "number", required: true },
        { name: "score", type: "number", required: true },
      ],
    },
    {
      id: "season_settings", label: "season_settings", group: "finance", color: COLORS.finance,
      x: 50, y: 530,
      fields: [
        { name: "id", type: "text", required: true, pk: true },
        { name: "season", type: "select", required: true },
        { name: "prizePool", type: "number", required: true },
        { name: "distributed", type: "bool", required: false },
      ],
    },
    {
      id: "prize_distributions", label: "prize_distributions", group: "finance", color: COLORS.finance,
      x: 50, y: 730,
      fields: [
        { name: "id", type: "text", required: true, pk: true },
        { name: "tournament", type: "relation", required: true, fk: "tournaments" },
        { name: "team", type: "relation", required: true, fk: "teams" },
        { name: "position", type: "number", required: true },
        { name: "prizeAmount", type: "number", required: true },
        { name: "season", type: "text", required: true },
      ],
    },
    {
      id: "playoffs", label: "playoffs", group: "playoff", color: COLORS.playoff,
      x: 600, y: 780,
      fields: [
        { name: "id", type: "text", required: true, pk: true },
        { name: "tournament", type: "relation", required: true, fk: "tournaments" },
        { name: "playoffRound", type: "number", required: true },
        { name: "forPosition", type: "number", required: true },
        { name: "status", type: "select", required: false },
        { name: "winner", type: "relation", required: false, fk: "teams" },
      ],
    },
    {
      id: "playoff_teams", label: "playoff_teams", group: "playoff", color: COLORS.playoff,
      x: 900, y: 680,
      fields: [
        { name: "id", type: "text", required: true, pk: true },
        { name: "playoff", type: "relation", required: true, fk: "playoffs" },
        { name: "team", type: "relation", required: true, fk: "teams" },
        { name: "tiedScore", type: "number", required: true },
      ],
    },
    {
      id: "playoff_throws", label: "playoff_throws", group: "playoff", color: COLORS.playoff,
      x: 900, y: 880,
      fields: [
        { name: "id", type: "text", required: true, pk: true },
        { name: "playoff", type: "relation", required: true, fk: "playoffs" },
        { name: "team", type: "relation", required: true, fk: "teams" },
        { name: "player", type: "relation", required: true, fk: "players" },
        { name: "distanceFeet", type: "number", required: true },
        { name: "throwOrder", type: "number", required: true },
      ],
    },
  ];

  // Build links from FK fields
  const links: Link[] = [];
  for (const entity of entities) {
    for (const field of entity.fields) {
      if (field.fk) {
        links.push({
          source: entity.id,
          target: field.fk,
          sourceField: field.name,
          label: field.name,
        });
      }
    }
  }

  const HEADER_H = 28;
  const ROW_H = 20;
  const NODE_W = 220;

  function nodeHeight(e: Entity): number {
    return HEADER_H + e.fields.length * ROW_H + 6;
  }

  let svgEl: SVGSVGElement;

  onMount(() => {
    const width = svgEl.parentElement?.clientWidth ?? 1200;
    const height = 1050;

    const svg = d3
      .select(svgEl)
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`);

    // Zoom
    const g = svg.append("g");
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 3])
        .on("zoom", (event) => {
          g.attr("transform", event.transform);
        }) as any
    );

    // Arrow marker
    svg
      .append("defs")
      .append("marker")
      .attr("id", "arrowhead")
      .attr("viewBox", "0 0 10 7")
      .attr("refX", 10)
      .attr("refY", 3.5)
      .attr("markerWidth", 8)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("polygon")
      .attr("points", "0 0, 10 3.5, 0 7")
      .attr("fill", "#6366f1");

    // Entity position map for link drawing
    const posMap = new Map<string, { x: number; y: number; h: number }>();
    for (const e of entities) {
      posMap.set(e.id, { x: e.x, y: e.y, h: nodeHeight(e) });
    }

    // Draw links
    const linkGroup = g.append("g").attr("class", "links");

    function updateLinks() {
      linkGroup.selectAll("*").remove();

      for (const link of links) {
        const s = posMap.get(link.source);
        const t = posMap.get(link.target);
        if (!s || !t) continue;

        const sx = s.x + NODE_W;
        const sy = s.y + s.h / 2;
        const tx = t.x;
        const ty = t.y + (posMap.get(link.target)?.h ?? 0) / 2;

        // Decide connection side
        let x1: number, y1: number, x2: number, y2: number;
        const sRight = s.x + NODE_W;
        const tRight = t.x + NODE_W;
        const sCx = s.x + NODE_W / 2;
        const tCx = t.x + NODE_W / 2;

        // Connect from closest edges
        if (sCx < tCx) {
          x1 = sRight;
          x2 = t.x;
        } else {
          x1 = s.x;
          x2 = tRight;
        }
        y1 = s.y + s.h / 2;
        y2 = t.y + (posMap.get(link.target)?.h ?? 0) / 2;

        const midX = (x1 + x2) / 2;

        linkGroup
          .append("path")
          .attr(
            "d",
            `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`
          )
          .attr("fill", "none")
          .attr("stroke", "#6366f1")
          .attr("stroke-width", 1.5)
          .attr("stroke-opacity", 0.6)
          .attr("marker-end", "url(#arrowhead)");

        // Label on the link
        const labelX = midX;
        const labelY = (y1 + y2) / 2 - 6;
        linkGroup
          .append("text")
          .attr("x", labelX)
          .attr("y", labelY)
          .attr("text-anchor", "middle")
          .attr("font-size", "9px")
          .attr("fill", "#6366f1")
          .attr("font-weight", 500)
          .text(link.label);
      }
    }

    updateLinks();

    // Draw entity nodes
    const nodeGroup = g.append("g").attr("class", "nodes");

    for (const entity of entities) {
      const h = nodeHeight(entity);
      const node = nodeGroup
        .append("g")
        .attr("transform", `translate(${entity.x}, ${entity.y})`)
        .attr("cursor", "grab")
        .call(
          d3
            .drag<SVGGElement, unknown>()
            .on("start", function () {
              d3.select(this).attr("cursor", "grabbing").raise();
            })
            .on("drag", function (event) {
              entity.x = event.x;
              entity.y = event.y;
              d3.select(this).attr(
                "transform",
                `translate(${entity.x}, ${entity.y})`
              );
              const p = posMap.get(entity.id);
              if (p) {
                p.x = entity.x;
                p.y = entity.y;
              }
              updateLinks();
            })
            .on("end", function () {
              d3.select(this).attr("cursor", "grab");
            }) as any
        );

      // Shadow
      node
        .append("rect")
        .attr("x", 2)
        .attr("y", 2)
        .attr("width", NODE_W)
        .attr("height", h)
        .attr("rx", 6)
        .attr("fill", "#00000010");

      // Card background
      node
        .append("rect")
        .attr("width", NODE_W)
        .attr("height", h)
        .attr("rx", 6)
        .attr("fill", "#ffffff")
        .attr("stroke", "#e2e8f0")
        .attr("stroke-width", 1);

      // Header background
      node
        .append("rect")
        .attr("width", NODE_W)
        .attr("height", HEADER_H)
        .attr("rx", 6)
        .attr("fill", entity.color);

      // Square off bottom corners of header
      node
        .append("rect")
        .attr("y", HEADER_H - 6)
        .attr("width", NODE_W)
        .attr("height", 6)
        .attr("fill", entity.color);

      // Header text
      node
        .append("text")
        .attr("x", NODE_W / 2)
        .attr("y", HEADER_H / 2 + 1)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("font-size", "12px")
        .attr("font-weight", 700)
        .attr("fill", "#1e293b")
        .text(entity.label);

      // Fields
      entity.fields.forEach((field, i) => {
        const fy = HEADER_H + i * ROW_H + ROW_H / 2 + 3;

        // PK/FK icon
        if (field.pk) {
          node
            .append("text")
            .attr("x", 8)
            .attr("y", fy)
            .attr("dominant-baseline", "middle")
            .attr("font-size", "9px")
            .attr("fill", "#eab308")
            .attr("font-weight", 700)
            .text("PK");
        } else if (field.fk) {
          node
            .append("text")
            .attr("x", 8)
            .attr("y", fy)
            .attr("dominant-baseline", "middle")
            .attr("font-size", "9px")
            .attr("fill", "#6366f1")
            .attr("font-weight", 700)
            .text("FK");
        }

        // Field name
        node
          .append("text")
          .attr("x", 30)
          .attr("y", fy)
          .attr("dominant-baseline", "middle")
          .attr("font-size", "11px")
          .attr("fill", field.fk ? "#6366f1" : "#334155")
          .attr("font-weight", field.required ? 600 : 400)
          .text(field.name);

        // Field type
        node
          .append("text")
          .attr("x", NODE_W - 8)
          .attr("y", fy)
          .attr("text-anchor", "end")
          .attr("dominant-baseline", "middle")
          .attr("font-size", "10px")
          .attr("fill", "#94a3b8")
          .text(field.type);
      });
    }

    // Legend
    const legend = g.append("g").attr("transform", `translate(20, ${height - 100})`);
    const groups = [
      { label: "Auth", color: COLORS.auth },
      { label: "Core", color: COLORS.core },
      { label: "League", color: COLORS.league },
      { label: "Scoring", color: COLORS.scoring },
      { label: "Playoff", color: COLORS.playoff },
      { label: "Finance", color: COLORS.finance },
    ];

    legend
      .append("rect")
      .attr("x", -10)
      .attr("y", -10)
      .attr("width", groups.length * 100 + 20)
      .attr("height", 36)
      .attr("rx", 6)
      .attr("fill", "#ffffff")
      .attr("stroke", "#e2e8f0");

    groups.forEach((gr, i) => {
      const gx = i * 100;
      legend
        .append("rect")
        .attr("x", gx)
        .attr("y", 0)
        .attr("width", 14)
        .attr("height", 14)
        .attr("rx", 3)
        .attr("fill", gr.color)
        .attr("stroke", "#cbd5e1");
      legend
        .append("text")
        .attr("x", gx + 20)
        .attr("y", 11)
        .attr("font-size", "11px")
        .attr("fill", "#475569")
        .text(gr.label);
    });
  });
</script>

<div class="w-full overflow-hidden rounded-lg border border-border bg-white">
  <svg bind:this={svgEl} class="w-full" style="min-height: 700px;"></svg>
</div>
