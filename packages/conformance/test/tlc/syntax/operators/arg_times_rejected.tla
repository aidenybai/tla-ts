(*---
description: "\\times is rejected as an argument like \\X."
ref: "tla2sany/parser/TLAplusParser.java#OpOrExpr"
features: [operators]
outcome: parse-error
---*)
---- MODULE arg_times_rejected ----
Op(F(_,_), a, b) == F(a, b)
Test == Op(\times, {1}, {2}) = {}
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | line 9, col 12 to line 9, col 17 of module arg_times_rejected: \X may not be used as an infix operator.
    | Residual stack trace follows:
    | Optional Arguments starting at line 9, column 11.
    | Primitive expression starting at line 9, column 9.
    | ExtendableExpr starting at line 9, column 9.
    | Expression starting at line 9, column 9.
    | Definition starting at line 9, column 1.
    | Fatal errors while parsing TLA+ spec in file arg_times_rejected
    | In module arg_times_rejected
    | Could not parse module arg_times_rejected from file arg_times_rejected.tla
    | *** Errors: 1
    | In module arg_times_rejected
    | Could not parse module arg_times_rejected from file arg_times_rejected.tla
    3002:1 Parsing or semantic analysis failed.
---*)
