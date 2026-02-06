package main

import (
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/jsvm"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
)

func main() {
	app := pocketbase.New()

	// ---- Custom "base-style" flags (so your old command works) ----
	//
	// Note: These are NOT part of the minimal Go example; we add them explicitly
	// to mirror the standalone executable behavior. :contentReference[oaicite:3]{index=3}
	//
	cwd, _ := os.Getwd()
	defaultHooksDir := filepath.Join(cwd, "..", "pb_hooks")
	defaultMigrationsDir := filepath.Join(cwd, "..", "pb_migrations")

	var hooksDir string
	var migrationsDir string
	var hooksWatch bool
	var hooksPool int

	app.RootCmd.PersistentFlags().StringVar(
		&migrationsDir,
		"migrationsDir",
		defaultMigrationsDir,
		"JS migrations directory (pb_migrations)",
	)
	app.RootCmd.PersistentFlags().StringVar(
		&hooksDir,
		"hooksDir",
		defaultHooksDir,
		"JS hooks directory (pb_hooks)",
	)
	app.RootCmd.PersistentFlags().BoolVar(
		&hooksWatch,
		"hooksWatch",
		true,
		"Watch hooksDir for changes (dev)",
	)
	app.RootCmd.PersistentFlags().IntVar(
		&hooksPool,
		"hooksPool",
		15,
		"Hooks worker pool size",
	)

	// ---- JSVM plugin (loads pb_hooks + pb_migrations) ----
	jsvm.MustRegister(app, jsvm.Config{
		HooksDir:      hooksDir,
		HooksWatch:    hooksWatch,
		HooksPoolSize: hooksPool,
		MigrationsDir: migrationsDir,
	})

	// ---- Migrate command (+ optional automigrate) ----
	isGoRun := strings.HasPrefix(os.Args[0], os.TempDir())
	migratecmd.MustRegister(app, app.RootCmd, migratecmd.Config{
		TemplateLang: migratecmd.TemplateLangJS,
		Automigrate:  isGoRun,
		Dir:          migrationsDir,
	})

	// Optional: serve ./pb_public if you have it
	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		se.Router.GET("/{path...}", apis.Static(os.DirFS("./pb_public"), false))

		// EXAMPLE: Custom scoring endpoint if you need Go performance
		// se.Router.POST("/api/scoring/calculate", func(e *core.RequestEvent) error {
		// 	// Custom high-performance scoring calculation
		// 	// Access DB: e.App.DB()
		// 	// Return JSON: return e.JSON(200, result)
		// })

		return se.Next()
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
