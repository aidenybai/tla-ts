(*---
description: The syntax corpus case "Set Filter with Tuple" in sets.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/sets.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE sets_set_filter_with_tuple ----
EXTENDS TestPrelude
op == {<<x, y, z>> \in Nat \X Int \X Real : P(x, y, z)}
====
---- MODULE TestPrelude ----
CONSTANTS Nat, Int, Real, P(_, _, _)
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./sets_set_filter_with_tuple.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./sets_set_filter_with_tuple.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
