(*---
description: The syntax corpus case "Set Map with Multiple Generators" in sets.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/sets.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE sets_set_map_with_multiple_generators ----
EXTENDS TestPrelude
op == {f(x, y, z) : x \in Int, y, z \in Real}
====
---- MODULE TestPrelude ----
CONSTANTS Int, Real, f(_, _, _)
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./sets_set_map_with_multiple_generators.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./sets_set_map_with_multiple_generators.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
