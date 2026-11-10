(*---
description: "<<1>>>2 reads >> first, then >, which is undefined without Naturals."
ref: "tla2sany/parser/TLAplusParser.java#TupleOrAction"
features: [tuples]
outcome: parse-error
---*)
---- MODULE closing_then_greater ----
Test == <<1>>>2
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 8, col 14 to line 8, col 14 of module closing_then_greater
    | Could not find declaration or definition of symbol '>'.
    | line 8, col 9 to line 8, col 15 of module closing_then_greater
    | Couldn't resolve infix operator symbol `>'.
    3002:1 Parsing or semantic analysis failed.
---*)
