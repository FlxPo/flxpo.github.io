rem zip all files without git to zip archive -2 compression methods - fast (-mx0) or strong (-mx9)
7z a -tzip my-app.nw * -xr!?git\* -mx0
rem copy nw.pak from current build node-webkit to current (%~dp0) folder
copy c:\node-webkit\nw.pak nw.pak
rem copy icudtl.dat from current build node-webkit
copy c:\node-webkit\icudtl.dat icudtl.dat
rem compilation to executable form
copy /b c:\node-webkit\nw.exe+%~dp0my-app.nw build\win32\my-app.exe
rem move nw.pak to build folder
copy nw.pak .\build\win32\nw.pak
rem move icudtl.dat to build folder
copy icudtl.dat .\build\win32\icudtl.dat
rem remove my-app.nw
pause