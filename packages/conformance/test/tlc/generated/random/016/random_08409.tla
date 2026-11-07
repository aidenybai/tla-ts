(*---
description: Evaluates a random set expression, seed 262, number 8409.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_08409 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({IF (({1, 2} \cap {1}) \subseteq (2..1 \cup Nat)) THEN {Len(<<1>>) : b13017 \in (<<3, 1, 2>> :> 1)} ELSE Head(Tail(<<>>)), (Len(<<0, 2147483647>>) \div (Head(<<1, 2>>) + (--1)))})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 189 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 186.
    | ExtendableExpr starting at line 14, column 169.
    | Expression starting at line 14, column 169.
    | ExtendableExpr starting at line 14, column 168.
    | ExtendableExpr starting at line 14, column 140.
    | Fatal errors while parsing TLA+ spec in file random_08409
    | In module random_08409
    | Could not parse module random_08409 from file random_08409.tla
    | *** Errors: 1
    | In module random_08409
    | Could not parse module random_08409 from file random_08409.tla
    3002:1 Parsing or semantic analysis failed.
---*)
