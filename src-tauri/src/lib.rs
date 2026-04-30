use tauri::{menu::{Menu, MenuItem, PredefinedMenuItem, Submenu}, Manager};
use tauri_plugin_log::{Target, TargetKind};
use std::path::PathBuf;

fn log_dir() -> PathBuf {
    dirs::home_dir()
        .unwrap_or_default()
        .join("Library")
        .join("Logs")
        .join("com.jsonight.editor")
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let _ = std::fs::create_dir_all(log_dir());
    eprintln!("[JSONight] === Starting ===");
    eprintln!("[JSONight] Platform: {} {}", std::env::consts::OS, std::env::consts::ARCH);
    eprintln!("[JSONight] Log dir: {:?}", log_dir());

    eprintln!("[JSONight] Initializing log plugin...");
    let log_plugin = tauri_plugin_log::Builder::default()
        .targets([
            Target::new(TargetKind::Stdout),
            Target::new(TargetKind::Stderr),
            Target::new(TargetKind::Folder {
                path: log_dir(),
                file_name: None,
            }),
        ])
        .level(log::LevelFilter::Debug)
        .build();

    eprintln!("[JSONight] Initializing dialog plugin...");
    eprintln!("[JSONight] Initializing fs plugin...");
    eprintln!("[JSONight] Initializing shell plugin...");
    eprintln!("[JSONight] Building Tauri app...");

    tauri::Builder::default()
        .plugin(log_plugin)
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            log::debug!("[JSONight] Entering setup");
            let handle = app.handle();
            log::debug!("[JSONight] App identifier: {}", handle.config().identifier);
            log::debug!("[JSONight] App version: {:?}", handle.config().version);

            let file_menu = Submenu::with_items(
                app, "File", true,
                &[
                    &MenuItem::with_id(app, "new", "New", true, Some("CmdOrCtrl+N"))?,
                    &MenuItem::with_id(app, "open", "Open", true, Some("CmdOrCtrl+O"))?,
                    &PredefinedMenuItem::separator(app)?,
                    &MenuItem::with_id(app, "save", "Save", true, Some("CmdOrCtrl+S"))?,
                    &MenuItem::with_id(app, "save_as", "Save As...", true, Some("CmdOrCtrl+Shift+S"))?,
                    &PredefinedMenuItem::separator(app)?,
                    &PredefinedMenuItem::quit(app, None)?,
                ],
            )?;

            let edit_menu = Submenu::with_items(
                app, "Edit", true,
                &[
                    &MenuItem::with_id(app, "undo", "Undo", true, Some("CmdOrCtrl+Z"))?,
                    &MenuItem::with_id(app, "redo", "Redo", true, Some("CmdOrCtrl+Shift+Z"))?,
                    &PredefinedMenuItem::separator(app)?,
                    &MenuItem::with_id(app, "cut", "Cut", true, Some("CmdOrCtrl+X"))?,
                    &MenuItem::with_id(app, "copy", "Copy", true, Some("CmdOrCtrl+C"))?,
                    &MenuItem::with_id(app, "paste", "Paste", true, Some("CmdOrCtrl+V"))?,
                    &MenuItem::with_id(app, "select_all", "Select All", true, Some("CmdOrCtrl+A"))?,
                ],
            )?;

            let tools_menu = Submenu::with_items(
                app, "Tools", true,
                &[
                    &MenuItem::with_id(app, "format", "Format JSON", true, Some("CmdOrCtrl+Shift+F"))?,
                    &MenuItem::with_id(app, "minify", "Minify JSON", true, Some("CmdOrCtrl+Shift+M"))?,
                    &PredefinedMenuItem::separator(app)?,
                    &MenuItem::with_id(app, "parse_python", "Parse Python Dict", true, Some("CmdOrCtrl+Shift+P"))?,
                ],
            )?;

            let layout_submenu = Submenu::with_items(
                app, "Layout", true,
                &[
                    &MenuItem::with_id(app, "layout_split", "Editor & Preview", true, None::<&str>)?,
                    &MenuItem::with_id(app, "layout_editor", "Editor Only", true, None::<&str>)?,
                    &MenuItem::with_id(app, "layout_preview", "Preview Only", true, None::<&str>)?,
                ],
            )?;

            let theme_submenu = Submenu::with_items(
                app, "Theme", true,
                &[
                    &MenuItem::with_id(app, "theme_light", "Light", true, None::<&str>)?,
                    &MenuItem::with_id(app, "theme_dark", "Dark", true, None::<&str>)?,
                    &PredefinedMenuItem::separator(app)?,
                    &MenuItem::with_id(app, "theme_system", "System", true, None::<&str>)?,
                ],
            )?;

            let view_menu = Submenu::with_items(
                app, "View", true,
                &[
                    &MenuItem::with_id(app, "toggle_preview", "Toggle Preview", true, Some("CmdOrCtrl+P"))?,
                    &MenuItem::with_id(app, "toggle_line_numbers", "Toggle Line Numbers", true, Some("CmdOrCtrl+L"))?,
                    &PredefinedMenuItem::separator(app)?,
                    &layout_submenu,
                    &theme_submenu,
                ],
            )?;

            let menu = Menu::with_items(app, &[&file_menu, &edit_menu, &tools_menu, &view_menu])?;
            app.set_menu(menu)?;
            log::debug!("[JSONight] Menu set successfully");
            log::debug!("[JSONight] Setup complete");
            Ok(())
        })
        .on_menu_event(|app, event| {
            let window = app.get_webview_window("main").unwrap();
            let _ = match event.id().as_ref() {
                "new" => window.eval("window.__handleMenu('new')"),
                "open" => window.eval("window.__handleMenu('open')"),
                "save" => window.eval("window.__handleMenu('save')"),
                "save_as" => window.eval("window.__handleMenu('save_as')"),
                "undo" => window.eval("document.execCommand('undo')"),
                "redo" => window.eval("document.execCommand('redo')"),
                "cut" => window.eval("document.execCommand('cut')"),
                "copy" => window.eval("document.execCommand('copy')"),
                "paste" => window.eval("document.execCommand('paste')"),
                "select_all" => window.eval("window.__handleMenu('select_all')"),
                "format" => window.eval("window.__handleMenu('format')"),
                "minify" => window.eval("window.__handleMenu('minify')"),
                "parse_python" => window.eval("window.__handleMenu('parse_python')"),
                "toggle_preview" => window.eval("window.__handleMenu('toggle_preview')"),
                "toggle_line_numbers" => window.eval("window.__handleMenu('toggle_line_numbers')"),
                "layout_split" => window.eval("window.__handleMenu('layout_split')"),
                "layout_editor" => window.eval("window.__handleMenu('layout_editor')"),
                "layout_preview" => window.eval("window.__handleMenu('layout_preview')"),
                "theme_light" => window.eval("window.__handleMenu('theme_light')"),
                "theme_dark" => window.eval("window.__handleMenu('theme_dark')"),
                "theme_system" => window.eval("window.__handleMenu('theme_system')"),
                _ => Ok(()),
            };
        })
        .run(tauri::generate_context!())
        .expect("error while running Tauri application");
}
