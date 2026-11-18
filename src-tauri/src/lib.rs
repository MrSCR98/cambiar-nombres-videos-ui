mod abrir_enlace;
mod archivos;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // Selector de carpetas y portapapeles (plugins oficiales de Tauri).
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![
            archivos::listar_archivos,
            archivos::renombrar_lote,
            abrir_enlace::abrir_enlace,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
