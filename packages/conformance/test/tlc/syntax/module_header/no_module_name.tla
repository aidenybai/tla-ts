(*---
description: The header needs a name.
ref: "tla2sany/parser/TLAplusParser.java#BeginModule"
features: [module_header]
outcome: parse-error
---*)
---- MODULE ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "Identifier"
    | Encountered "----" at line 7, column 13 and token "---- MODULE" 
    | Residual stack trace follows:
    | Begin module starting at line 7, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file no_module_name
    | In module no_module_name
    | Could not parse module no_module_name from file no_module_name.tla
    | *** Errors: 1
    | In module no_module_name
    | Could not parse module no_module_name from file no_module_name.tla
    3002:1 Parsing or semantic analysis failed.
---*)
