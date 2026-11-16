(*---
description: The syntax corpus case "Bounded CHOOSE" in quantification.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/quantification.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE quantification_bounded_choose ----
EXTENDS TestPrelude
op == CHOOSE x \in Nat : TRUE
====
---- MODULE TestPrelude ----
CONSTANTS Nat
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./quantification_bounded_choose.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./quantification_bounded_choose.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
