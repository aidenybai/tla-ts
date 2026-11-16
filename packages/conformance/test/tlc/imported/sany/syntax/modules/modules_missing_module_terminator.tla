(*---
description: Missing Module Terminator. Ported from SANY's syntax corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/corpus/modules.txt
features:
  - sany-syntax
outcome: parse-error
---*)
---- MODULE modules_missing_module_terminator ----

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "<EOF>" at line 8, column 51 and token "----" 
    | Residual stack trace follows:
    | Module definition starting at line 8, column 1.
    | Fatal errors while parsing TLA+ spec in file modules_missing_module_terminator
    | In module modules_missing_module_terminator
    | Could not parse module modules_missing_module_terminator from file modules_missing_module_terminator.tla
    | *** Errors: 1
    | In module modules_missing_module_terminator
    | Could not parse module modules_missing_module_terminator from file modules_missing_module_terminator.tla
    3002:1 Parsing or semantic analysis failed.
---*)
