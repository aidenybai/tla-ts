(*---
description: Evaluates a random bool expression, seed 262, number 9034.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09034 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((CASE (~(FALSE <=> FALSE)) -> (CASE TRUE -> 1 [] OTHER -> 1 + (7 + 2147483647)) [] OTHER -> ((--1) % (2147483647 + 7)) < (((1 :> 7))[Head(<<>>)] * IF ([a |-> 1] = [a |-> 1, b |-> TRUE]) THEN (~FALSE) ELSE Len(<<1, 2>>))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 112 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 109.
    | Expression starting at line 14, column 109.
    | ExtendableExpr starting at line 14, column 108.
    | Expression starting at line 14, column 108.
    | Case Other Arm starting at line 14, column 99.
    | Fatal errors while parsing TLA+ spec in file random_09034
    | In module random_09034
    | Could not parse module random_09034 from file random_09034.tla
    | *** Errors: 1
    | In module random_09034
    | Could not parse module random_09034 from file random_09034.tla
    3002:1 Parsing or semantic analysis failed.
---*)
