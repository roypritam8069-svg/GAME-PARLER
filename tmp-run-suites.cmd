@echo off
set "VERIFY_URL=http://localhost:3000"
node tmp-img-proof2.mjs > proof2.log 2>&1
node verify-func.mjs > verify-func.log 2>&1
echo FUNC_EXIT=%ERRORLEVEL% >> verify-func.log
node verify-nav.mjs > verify-nav.log 2>&1
echo NAV_EXIT=%ERRORLEVEL% >> verify-nav.log
echo DONE > suites.done
