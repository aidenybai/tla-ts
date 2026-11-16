(*---
description: The syntax corpus case "All Number Sets" in number.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/number.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE number_all_number_sets ----
EXTENDS TestPrelude
op1 == Nat
op2 == Int
op3 == Real
====
---- MODULE TestPrelude ----
CONSTANTS Nat, Int, Real
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./number_all_number_sets.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./number_all_number_sets.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
