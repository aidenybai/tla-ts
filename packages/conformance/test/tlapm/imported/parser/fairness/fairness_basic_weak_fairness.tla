(*---
description: The syntax corpus case "Basic Weak Fairness" in fairness.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/fairness.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE fairness_basic_weak_fairness ----
EXTENDS TestPrelude
op == WF_(vars)(x)
====
---- MODULE TestPrelude ----
VARIABLES vars, x
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./fairness_basic_weak_fairness.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./fairness_basic_weak_fairness.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
