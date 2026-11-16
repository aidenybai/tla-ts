(*---
description: The syntax corpus case "Simple Use or Hide" in use_or_hide.txt, which tlapm's parser tests read.
ref: test/parser/syntax_corpus/use_or_hide.txt
features:
  - tlapm-test
  - syntax-corpus
mode: obligations
outcome: rejected
---*)
---- MODULE use_or_hide_simple_use_or_hide ----
EXTENDS TestPrelude
USE X, Y
HIDE X
HIDE Y
====
---- MODULE TestPrelude ----
THEOREM X == TRUE
THEOREM Y == TRUE
====

(*--- recorded
all:
  exit: 3
  transcript: |-
    @type: warning
    @msg: File "./use_or_hide_simple_use_or_hide.tla", line 11, characters 9-19

    Unknown module "TestPrelude"

    File "./use_or_hide_simple_use_or_hide.tla", line 11, characters 9-19:
    Error: Unknown module "TestPrelude"
     tlapm ending abnormally with Failure("Module.Parser.load_module")
---*)
