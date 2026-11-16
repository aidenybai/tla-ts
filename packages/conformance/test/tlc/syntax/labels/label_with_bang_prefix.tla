(*---
description: A label name cannot hold a bang.
ref: "tla2sany/parser/TLAplusParser.java#isLabel"
features: [labels]
outcome: parse-error
---*)
---- MODULE label_with_bang_prefix ----
Op == A!l:: TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | `::' at line 8, col 10 to line 8, col 11 of module label_with_bang_prefix does not follow a label.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 8, column 7.
    | Expression starting at line 8, column 7.
    | Definition starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file label_with_bang_prefix
    | In module label_with_bang_prefix
    | Could not parse module label_with_bang_prefix from file label_with_bang_prefix.tla
    | *** Errors: 1
    | In module label_with_bang_prefix
    | Could not parse module label_with_bang_prefix from file label_with_bang_prefix.tla
    3002:1 Parsing or semantic analysis failed.
---*)
