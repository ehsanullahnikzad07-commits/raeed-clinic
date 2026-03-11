; Custom NSIS installer script
!macro customInstall
  ; Create data directory for database
  CreateDirectory "$APPDATA\RaeedOPDClinic"
  CreateDirectory "$APPDATA\RaeedOPDClinic\database"
!macroend
