(*---
description: Evaluates a random bool expression, seed 262, number 9365.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09365 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\E b14537 \in ((CASE TRUE -> 1 [] OTHER -> 1 :> (--1)) .. Len([<<>> EXCEPT ![1] = -1])) : ((Head(<<>>) = (b14537 - 3)) \/ ((TRUE \/ FALSE) <=> (TRUE /\ TRUE)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 68 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 65.
    | ExtendableExpr starting at line 14, column 60.
    | Expression starting at line 14, column 60.
    | Case Other Arm starting at line 14, column 51.
    | CASE Expression starting at line 14, column 33.
    | Fatal errors while parsing TLA+ spec in file random_09365
    | In module random_09365
    | Could not parse module random_09365 from file random_09365.tla
    | *** Errors: 1
    | In module random_09365
    | Could not parse module random_09365 from file random_09365.tla
    3002:1 Parsing or semantic analysis failed.
---*)
