(*---
description: The syntax corpus case "Number Set Definitions" in number.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/number.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE number_number_set_definitions ----
EXTENDS TestPrelude
Nat == {}
op1 == A!Nat
Int == {}
op2 == A!Int
Real == {}
op3 == A!Real
====
---- MODULE TestPrelude ----
A == INSTANCE M
====
---- MODULE M ----
Nat == {}
Int == {}
Real == {}
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./number_number_set_definitions.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./number_number_set_definitions.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
