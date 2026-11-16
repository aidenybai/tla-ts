(*---
description: Ported from TLC's ETest16.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/suite/ETest16.java
features:
  - tlc-suite
outcome: parse-error
config: ""
---*)
--------------- MODULE etest16 -----------

\* Test of detecting duplicate record elements

Foo == [a |-> 1, b |-> 2, a |-> 1]

Bar == [a : {1}, b : {2}, a : {1}]
=============================================================================

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 13, col 27 to line 13, col 27 of module etest16
    | Non-unique fields in constructor.
    | line 15, col 27 to line 15, col 27 of module etest16
    | Non-unique fields in constructor.
    3002:1 Parsing or semantic analysis failed.
---*)
