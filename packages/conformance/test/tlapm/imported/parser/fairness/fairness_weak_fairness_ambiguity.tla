(*---
description: The syntax corpus case "Weak Fairness Ambiguity" in fairness.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/fairness.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE fairness_weak_fairness_ambiguity ----
EXTENDS TestPrelude
op == WF_vars(x)
====
---- MODULE TestPrelude ----
VARIABLES vars, x
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./fairness_weak_fairness_ambiguity.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./fairness_weak_fairness_ambiguity.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
