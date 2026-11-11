(*---
description: "A label before a looser-binding expression would change the parse, so it is rejected."
ref: "tla2sany/parser/TLAplusParser.java#labelDoesNotChangeParse"
features: [labels]
outcome: parse-error
---*)
---- MODULE label_would_change_parse ----
EXTENDS Naturals
Op == 1 * l:: 2 + 3
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Removing label at line 9, col 11 to line 9, col 11 of module label_would_change_parse would change expression parsing.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 9, column 11.
    | ExtendableExpr starting at line 9, column 7.
    | Expression starting at line 9, column 7.
    | Definition starting at line 9, column 1.
    | Module body starting at line 9, column 1.
    | Fatal errors while parsing TLA+ spec in file label_would_change_parse
    | In module label_would_change_parse
    | Could not parse module label_would_change_parse from file label_would_change_parse.tla
    | *** Errors: 1
    | In module label_would_change_parse
    | Could not parse module label_would_change_parse from file label_would_change_parse.tla
    3002:1 Parsing or semantic analysis failed.
---*)
