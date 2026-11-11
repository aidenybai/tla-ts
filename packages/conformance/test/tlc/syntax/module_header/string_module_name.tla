(*---
description: A string cannot name a module.
ref: "tla2sany/parser/TLAplusParser.java#BeginModule"
features: [module_header]
outcome: parse-error
---*)
---- MODULE "x" ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "Identifier"
    | Encountered ""x"" at line 7, column 13 and token "---- MODULE" 
    | Residual stack trace follows:
    | Begin module starting at line 7, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file string_module_name
    | In module string_module_name
    | Could not parse module string_module_name from file string_module_name.tla
    | *** Errors: 1
    | In module string_module_name
    | Could not parse module string_module_name from file string_module_name.tla
    3002:1 Parsing or semantic analysis failed.
---*)
