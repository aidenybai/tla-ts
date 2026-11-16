(*---
description: A bullet needs an expression.
ref: "tla2sany/parser/TLAplusParser.java#JuncItem"
features: [junctions]
outcome: parse-error
---*)
---- MODULE empty_bullet ----
Test ==
  /\
  /\ TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "/\" at line 10, column 3 and token "/\\" 
    | Residual stack trace follows:
    | Expression starting at line 10, column 3.
    | Junction Item starting at line 9, column 3.
    | AND-OR Junction starting at line 9, column 3.
    | ExtendableExpr starting at line 9, column 3.
    | Expression starting at line 9, column 3.
    | Fatal errors while parsing TLA+ spec in file empty_bullet
    | In module empty_bullet
    | Could not parse module empty_bullet from file empty_bullet.tla
    | *** Errors: 1
    | In module empty_bullet
    | Could not parse module empty_bullet from file empty_bullet.tla
    3002:1 Parsing or semantic analysis failed.
---*)
