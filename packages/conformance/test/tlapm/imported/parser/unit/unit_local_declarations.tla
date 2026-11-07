(*---
description: The syntax corpus case "LOCAL Declarations" in unit.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/unit.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE unit_local_declarations ----
EXTENDS TestPrelude
LOCAL op == y
LOCAL f[x \in Nat] == x
LOCAL INSTANCE M
LOCAL M == INSTANCE M
====
---- MODULE M ----
====
---- MODULE TestPrelude ----
Nat == {}
y == 0
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./unit_local_declarations.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    Unknown module "M"

    File "./unit_local_declarations.tla", line 14, characters 7-16:
    Error: Unknown module "M"
    File "./unit_local_declarations.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
