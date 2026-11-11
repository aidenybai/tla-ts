(*---
description: An EXTENDS list cannot end in a comma.
ref: "tla2sany/parser/TLAplusParser.java#Extends"
features: [module_header]
outcome: parse-error
---*)
---- MODULE extends_trailing_comma ----
EXTENDS Naturals,
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "Identifier"
    | Encountered "====" at line 9, column 1 and token "," 
    | Residual stack trace follows:
    | Extends starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file extends_trailing_comma
    | In module extends_trailing_comma
    | Could not parse module extends_trailing_comma from file extends_trailing_comma.tla
    | *** Errors: 1
    | In module extends_trailing_comma
    | Could not parse module extends_trailing_comma from file extends_trailing_comma.tla
    3002:1 Parsing or semantic analysis failed.
---*)
