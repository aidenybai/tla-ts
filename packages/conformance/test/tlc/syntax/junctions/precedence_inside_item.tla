(*---
description: "Item contents are parsed as a whole expression, so a non-associative chain is still a conflict."
ref: "tla2sany/parser/TLAplusParser.java#Expression"
features: [junctions]
outcome: parse-error
---*)
---- MODULE precedence_inside_item ----
Test ==
  /\ TRUE
  /\ 1 = 1 = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops = in block line 10, col 8 to line 10, col 8 of module precedence_inside_item and =.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 10, column 10.
    | ExtendableExpr starting at line 10, column 6.
    | Expression starting at line 10, column 6.
    | Junction Item starting at line 10, column 3.
    | AND-OR Junction starting at line 9, column 3.
    | Fatal errors while parsing TLA+ spec in file precedence_inside_item
    | In module precedence_inside_item
    | Could not parse module precedence_inside_item from file precedence_inside_item.tla
    | *** Errors: 1
    | In module precedence_inside_item
    | Could not parse module precedence_inside_item from file precedence_inside_item.tla
    3002:1 Parsing or semantic analysis failed.
---*)
