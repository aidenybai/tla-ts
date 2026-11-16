(*---
description: A label parameter must be a plain name.
ref: "tla2sany/parser/TLAplusParser.java#isLabel"
features: [labels]
outcome: parse-error
---*)
---- MODULE label_with_number_argument ----
Op == l(1):: TRUE
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | `::' at line 8, col 11 to line 8, col 12 of module label_with_number_argument does not follow a label.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 8, column 7.
    | Expression starting at line 8, column 7.
    | Definition starting at line 8, column 1.
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file label_with_number_argument
    | In module label_with_number_argument
    | Could not parse module label_with_number_argument from file label_with_number_argument.tla
    | *** Errors: 1
    | In module label_with_number_argument
    | Could not parse module label_with_number_argument from file label_with_number_argument.tla
    3002:1 Parsing or semantic analysis failed.
---*)
