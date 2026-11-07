(*---
description: The syntax corpus case "Basic Submodule Reference" in subexpressions.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/subexpressions.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE subexpressions_basic_submodule_reference ----
EXTENDS TestPrelude
op == M!X!Y!Z
====
---- MODULE TestPrelude ----
M == INSTANCE M1
====
---- MODULE M1 ----
X == INSTANCE M2
====
---- MODULE M2 ----
Y == INSTANCE M3
====
---- MODULE M3 ----
Z == 0
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./subexpressions_basic_submodule_reference.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./subexpressions_basic_submodule_reference.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
