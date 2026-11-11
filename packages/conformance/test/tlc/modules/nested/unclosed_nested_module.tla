(*---
description: "A nested module must be closed before the outer ends, so a single end line leaves the outer open."
ref: "tla2sany/parser/TLAplusParser.java#EndModule"
features: [nested]
outcome: parse-error
---*)
---- MODULE unclosed_nested_module ----
---- MODULE I ----
A == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "<EOF>" at line 10, column 5 and token "====" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file unclosed_nested_module
    | In module unclosed_nested_module
    | Could not parse module unclosed_nested_module from file unclosed_nested_module.tla
    | *** Errors: 1
    | In module unclosed_nested_module
    | Could not parse module unclosed_nested_module from file unclosed_nested_module.tla
    3002:1 Parsing or semantic analysis failed.
---*)
