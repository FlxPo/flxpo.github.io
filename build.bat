rem zip all files without git to zip archive -2 compression methods - fast (-mx0) or strong (-mx9)
7z.exe a -tzip my-app.nw * -xr!?git\* -mx0
rem copy nw.pak from current build node-webkit to current (%~dp0) folder
copy c:\node-webkit\nw.pak nw.pak
rem copy icudt.dll from current build node-webkit
copy c:\node-webkit\icudt.dll icudt.dll
rem compilation to executable form
copy /b c:\node-webkit\nw.exe+%~dp0my-app.nw ..\build\win32\my-app.exe
rem move nw.pak to build folder
copy nw.pak ..\build\win32\nw.pak
del nw.pak
rem move icudt.dll to build folder
copy icudt.dll ..\build\win32\icudt.dll
del icudt.dll
rem remove my-app.nw
del my-app.nw
rem run application
..\build\win32\my-app.exe