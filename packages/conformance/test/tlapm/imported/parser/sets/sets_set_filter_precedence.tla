(*---
description: The syntax corpus case "Set Filter Precedence" in sets.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/sets.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE sets_set_filter_precedence ----
EXTENDS TestPrelude
op == {x \in S : x \in T}
====
---- MODULE TestPrelude ----
VARIABLES S, T
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./sets_set_filter_precedence.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./sets_set_filter_precedence.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
