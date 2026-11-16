(*---
description: Evaluates a random seq expression, seed 262, number 4097.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04097 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<([b6440 \in {1, 1} |-> Head(<<3, 1, 2>>)])[(CASE FALSE -> 1 [] OTHER -> 1 % CASE TRUE -> -1 [] OTHER -> -1)], (IF (2..1 = Nat) THEN (--1) ELSE (1 % [a |-> 1, b |-> TRUE]) % ((CHOOSE f \in [1..2 -> 2..1] : TRUE))[CASE TRUE -> 3 [] OTHER -> 1])>>)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 153 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 150.
    | Expression starting at line 14, column 150.
    | IF THEN ELSE starting at line 14, column 129.
    | Expression starting at line 14, column 129.
    | ExtendableExpr starting at line 14, column 128.
    | Fatal errors while parsing TLA+ spec in file random_04097
    | In module random_04097
    | Could not parse module random_04097 from file random_04097.tla
    | *** Errors: 1
    | In module random_04097
    | Could not parse module random_04097 from file random_04097.tla
    3002:1 Parsing or semantic analysis failed.
---*)
