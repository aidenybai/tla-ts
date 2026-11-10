(*---
description: A newline between the dashes and MODULE leaves no opening token.
ref: "tla2sany/parser/TLAplusParser.java#BeginModule"
features: [module_header]
outcome: parse-error
---*)
----
MODULE newline_before_module ----
ASSUME TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "---- MODULE (beginning of module)"
    | Encountered "<EOF>" at line 10, column 5 and token "" 
    | Residual stack trace follows:
    | Begin module starting at line 10, column 5.
    | Module definition starting at line 10, column 5.
    | Fatal errors while parsing TLA+ spec in file newline_before_module
    | In module newline_before_module
    | Could not parse module newline_before_module from file newline_before_module.tla
    | *** Errors: 1
    | In module newline_before_module
    | Could not parse module newline_before_module from file newline_before_module.tla
    3002:1 Parsing or semantic analysis failed.
---*)
