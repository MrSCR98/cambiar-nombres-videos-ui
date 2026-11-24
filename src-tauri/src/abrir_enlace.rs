use std::process::Command;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

// Esta es la única función que necesitas
#[tauri::command]
pub fn abrir_enlace(url: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let status = Command::new("cmd")
            .args(["/C", "start", "", &url])
            .creation_flags(0x08000000)
            .status()
            .map_err(|e| e.to_string())?;

        if status.success() {
            Ok(())
        } else {
            Err("No se pudo abrir el enlace".into())
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("Esta función solo está configurada para Windows".into())
    }
}
