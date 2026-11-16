(*---
description: Evaluates a random bool expression, seed 262, number 5404.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_05404 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((([[a |-> 1] EXCEPT !.a = @ + 2]).a * CASE ([a |-> 1] = [a |-> 1]) -> Head(<<1, 2>>) [] OTHER -> (--1)) \in {(\E b8369 \in DOMAIN (1 :> 2) : (\E b8370 \in Nat : FALSE)) : b8368 \in {b8371 \in {b8372 \in 2..1 : FALSE} : ({1} \subseteq 2..1)}}))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "1" at line 14, column 117 and token "--" 
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 114.
    | Expression starting at line 14, column 114.
    | Case Other Arm starting at line 14, column 105.
    | CASE Expression starting at line 14, column 55.
    | ExtendableExpr starting at line 14, column 18.
    | Fatal errors while parsing TLA+ spec in file random_05404
    | In module random_05404
    | Could not parse module random_05404 from file random_05404.tla
    | *** Errors: 1
    | In module random_05404
    | Could not parse module random_05404 from file random_05404.tla
    3002:1 Parsing or semantic analysis failed.
---*)
