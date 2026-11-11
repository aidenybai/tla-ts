(*---
description: A trailing comma in WITH is a parse error.
ref: "tla2sany/parser/TLAplusParser.java#Instantiation"
features: [instance]
outcome: parse-error
---*)
---- MODULE with_trailing_comma ----
---- MODULE I ----
CONSTANT c
d == c
====
M == INSTANCE I WITH c <- 1,
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered ", ====" at line 12, column 28 and token "1" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file with_trailing_comma
    | In module with_trailing_comma
    | Could not parse module with_trailing_comma from file with_trailing_comma.tla
    | *** Errors: 1
    | In module with_trailing_comma
    | Could not parse module with_trailing_comma from file with_trailing_comma.tla
    3002:1 Parsing or semantic analysis failed.
---*)
