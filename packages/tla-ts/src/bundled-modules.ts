// TLC's Reals.tla, RealTime.tla, and Toolbox.tla, verbatim, so that errors inside them name the same
// lines as TLC's errors.
const REALS = `-------------------------------- MODULE Reals -------------------------------
(***************************************************************************)
(* This module provides dummy definitions of the operators that are        *)
(* defined by the real Reals module.  It is expected that any tool that    *)
(* handles specifications that use real numbers will provide its own       *)
(* implementations of these operators.  TLC currently does not handle real *)
(* numbers and produces an error if a specification requires TLC to        *)
(* evaluate the operators defined here or to evaluate any operator defined *)
(* in the Integers module that is applied to non-integer real numbers.     *)
(*                                                                         *)
(* See the book "Specifying Systems" for the real Reals module.            *)
(***************************************************************************)
EXTENDS Integers

Real  == "Reals"
a / b == CHOOSE m \\in Real : m * b = a
Infinity == CHOOSE i : (i \\notin Real) /\\ (\\A r \\in Real : i > r)
=============================================================================`;

const REAL_TIME = `----------------------------- MODULE RealTime -------------------------------
(***************************************************************************)
(* This standard module is described in Chapter 9 of the book "Specifying  *)
(* Systems".  The type of specification described there cannot be handled  *)
(* by the TLC model checker.                                               *)
(***************************************************************************)
EXTENDS Reals 
VARIABLE now

RTBound(A, v, D, E) == 
  LET TNext(t)  ==  t' = IF <<A>>_v \\/ ~(ENABLED <<A>>_v)'
                           THEN 0 
                           ELSE t + (now'-now)

      Timer(t) == (t=0)  /\\  [][TNext(t)]_<<t, v, now>>

      MaxTime(t) == [](t \\leq E) 

      MinTime(t) == [][A => t \\geq D]_v 
  IN \\EE t : Timer(t) /\\ MaxTime(t) /\\ MinTime(t)
-----------------------------------------------------------------------------
RTnow(v) == LET NowNext == /\\ now' \\in {r \\in Real : r > now} 
                           /\\ UNCHANGED v
            IN  /\\ now \\in Real 
                /\\ [][NowNext]_now
                /\\ \\A r \\in Real : WF_now(NowNext /\\ (now'>r))
=============================================================================`;

const TOOLBOX = `----------------------------- MODULE Toolbox --------------------------------
(***************************************************************************)
(*                                                                         *)
(***************************************************************************)
LOCAL INSTANCE Naturals   \\* a + b
LOCAL INSTANCE FiniteSets \\* Cardinality
LOCAL INSTANCE TLC        \\* TLCGet

-----------------------------------------------------------------------------

(* Trace Exploration *)

_TETrace ==
    CHOOSE f \\in [ (Nat \\ {0}) -> STRING ] : TRUE

LOCAL _TETraceLength == Cardinality(DOMAIN _TETrace)

\\* When evaluated as part of a TLC ALIAS expression, \`_TEPosition\` should be
\\* redefined as \`TLCGet("level"), or replace with \`TLCGet(level)\` right away.
\\* The definition below accounts for several "peculiarities" of the
\\* Toolbox's trace exploration.
_TEPosition == 
    IF TLCGet("level") >= _TETraceLength
       THEN _TETraceLength
       ELSE IF TLCGet("level") = 0 THEN 1 ELSE TLCGet("level")

=============================================================================`;

export const BUNDLED_MODULES = new Map([
  ["Reals", REALS],
  ["RealTime", REAL_TIME],
  ["Toolbox", TOOLBOX],
]);
