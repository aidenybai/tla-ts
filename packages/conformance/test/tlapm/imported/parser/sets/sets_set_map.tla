(*---
description: The syntax corpus case "Set Map" in sets.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/sets.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE sets_set_map ----
EXTENDS TestPrelude
op == {f(x) : x \in Nat}
====
---- MODULE TestPrelude ----
CONSTANTS Nat, f(_)
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./sets_set_map.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./sets_set_map.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
