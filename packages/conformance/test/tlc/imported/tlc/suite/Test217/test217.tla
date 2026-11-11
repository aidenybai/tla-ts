(*---
description: Ported from TLC's Test217.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/suite/Test217.java
features:
  - tlc-suite
outcome: parse-error
config: ""
includes:
  - test217a.tla
---*)
Sany should produce two level errors when parsing this module.

---- MODULE test217 ----
    \* 12 June 2014: Changed module name from Test217, which is now illegal
EXTENDS test217a
    \* 12 June 2014: Changed from Test217a, which is now illegal
VARIABLE x

I(z) == INSTANCE test217a WITH y <- z
    \* 12 June 2014: Changed from Test217a, which is now illegal

FooBar == I(x')!Foo
THEOREM I({x'})!Foo
===============================

(*--- recorded
all:
  exit: 150
  transcript: |-
    | Semantic errors:
    | *** Errors: 2
    | line 22, col 11 to line 22, col 19 of module test217
    | Level error in applying operator I!Foo:
    | The level of argument 1 exceeds the maximum level allowed by the operator.
    | line 23, col 9 to line 23, col 19 of module test217
    | Level error in applying operator I!Foo:
    | The level of argument 1 exceeds the maximum level allowed by the operator.
    3002:1 Parsing or semantic analysis failed.
---*)
