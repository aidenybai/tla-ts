(*---
description: The syntax corpus case "Function Set" in functions.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/functions.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE functions_function_set ----
EXTENDS TestPrelude
op == [Nat -> [Nat -> Real]]
====
---- MODULE TestPrelude ----
CONSTANTS Nat, Real
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./functions_function_set.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./functions_function_set.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
