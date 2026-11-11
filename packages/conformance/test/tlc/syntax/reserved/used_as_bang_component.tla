(*---
description: A reserved word cannot follow a bang in a name.
ref: "tla2sany/parser/TLAplusParser.java#BangExt"
features: [reserved]
outcome: parse-error
---*)
---- MODULE used_as_bang_component ----
Op == 1
Test == Op!THEN
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "THEN" at line 9, column 12 and token "!" 
    | Residual stack trace follows:
    | Bang Extension starting at line 9, column 11.
    | Primitive expression starting at line 9, column 9.
    | ExtendableExpr starting at line 9, column 9.
    | Expression starting at line 9, column 9.
    | Definition starting at line 9, column 1.
    | Fatal errors while parsing TLA+ spec in file used_as_bang_component
    | In module used_as_bang_component
    | Could not parse module used_as_bang_component from file used_as_bang_component.tla
    | *** Errors: 1
    | In module used_as_bang_component
    | Could not parse module used_as_bang_component from file used_as_bang_component.tla
    3002:1 Parsing or semantic analysis failed.
---*)
