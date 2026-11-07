(*---
description: The syntax corpus case "Complicated Use & Hide" in use_or_hide.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/use_or_hide.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE use_or_hide_complicated_use_hide ----
EXTENDS TestPrelude
USE x, 1 + 3
HIDE DEFS -., *, ^+
USE x DEF z, x
====
---- MODULE TestPrelude ----
x == 0
z == 0
-. a == 1
a ^+ == 1
a + b == 2
a * b == 2
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./use_or_hide_complicated_use_hide.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./use_or_hide_complicated_use_hide.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
