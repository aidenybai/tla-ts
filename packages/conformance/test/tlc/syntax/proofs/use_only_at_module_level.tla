(*---
description: USE ONLY is only for BY.
ref: "tla2sany/parser/TLAplusParser.java#Body"
features: [proofs]
outcome: parse-error
---*)
---- MODULE use_only_at_module_level ----
USE ONLY TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "USE" at line 8, column 1 and token "----" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file use_only_at_module_level
    | In module use_only_at_module_level
    | Could not parse module use_only_at_module_level from file use_only_at_module_level.tla
    | *** Errors: 1
    | In module use_only_at_module_level
    | Could not parse module use_only_at_module_level from file use_only_at_module_level.tla
    3002:1 Parsing or semantic analysis failed.
---*)
