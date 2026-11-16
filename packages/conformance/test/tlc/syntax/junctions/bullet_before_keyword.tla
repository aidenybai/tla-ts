(*---
description: A bullet cannot be followed by a keyword that starts no expression.
ref: "tla2sany/parser/TLAplusParser.java#JuncItem"
features: [junctions]
outcome: parse-error
---*)
---- MODULE bullet_before_keyword ----
Test ==
  /\ TRUE
  /\ ASSUMPTION
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "ASSUMPTION" at line 10, column 6 and token "/\\" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 10, column 6.
    | Expression starting at line 10, column 6.
    | Junction Item starting at line 10, column 3.
    | AND-OR Junction starting at line 9, column 3.
    | ExtendableExpr starting at line 9, column 3.
    | Fatal errors while parsing TLA+ spec in file bullet_before_keyword
    | In module bullet_before_keyword
    | Could not parse module bullet_before_keyword from file bullet_before_keyword.tla
    | *** Errors: 1
    | In module bullet_before_keyword
    | Could not parse module bullet_before_keyword from file bullet_before_keyword.tla
    3002:1 Parsing or semantic analysis failed.
---*)
