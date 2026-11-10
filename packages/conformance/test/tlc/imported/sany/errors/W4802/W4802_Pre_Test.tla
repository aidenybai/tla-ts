(*---
description: SANY reports W4802. Ported from SANY's error corpus.
source: tlatools/org.lamport.tlatools/test/tla2sany/semantic/error_corpus/W4802_Pre_Test.tla
features:
  - sany-errors
outcome: success
---*)
If a symbol is defined then a record is defined with a field name
overlapping with the symbol, generate a warning since the value of
the symbol will not be used as the record field name.
---- MODULE W4802_Pre_Test ----
Foo == TRUE
SomeRecord == [Foo |-> 42]
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | line 13, col 16 to line 13, col 18 of module W4802_Pre_Test
    | The field name "Foo" in the record constructor is identical to the existing definition or declaration
    | named Foo, located at line 12, col 1 to line 12, col 11 of module W4802_Pre_Test.
    | The field in the record will not take the value of the Foo definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [Foo |-> ...] = {"Foo"} holds true.
    2190:0 Finished computing initial states: 0 distinct states generated at <date>.
    2193:0 Model checking completed. No error has been found.
      Estimates of the probability that TLC did not check all reachable states
      because two distinct states had the same fingerprint:
      calculated (optimistic):  val = 0.0
    2199:0 0 states generated, 0 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 0.
---*)
