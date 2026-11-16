(*---
description: The syntax corpus case "Label With Parameters" in labels.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/labels.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE labels_label_with_parameters ----
EXTENDS TestPrelude
op == \A a, b \in Nat : lbl(a, b) :: P(a, b)
====
---- MODULE TestPrelude ----
CONSTANTS Nat, P(_, _)
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./labels_label_with_parameters.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./labels_label_with_parameters.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
