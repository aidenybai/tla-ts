// tlapm's standard library, verbatim from lib/tlapm/stdlib, so that proofs citing it load without
// tlapm installed. Folds, Functions and FunctionTheorems come from the CommunityModules that tlapm
// installs there. tlapm's license follows, then CommunityModules'.
//
// Copyright (c) 2008 INRIA and Microsoft Corporation
// Copyright (c) 2023 Linux Foundation
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//   * Redistributions of source code must retain the above copyright
//     notice, this list of conditions and the following disclaimer.
//
//   * Redistributions in binary form must reproduce the above copyright
//     notice, this list of conditions and the following disclaimer in
//     the documentation and/or other materials provided with the
//     distribution.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
// MIT License
//
// Copyright (c) 2019 TLA+
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.
export const TLAPM_LIBRARY = new Map([
  [
    "TLAPS",
    `------------------------------- MODULE TLAPS --------------------------------

(* Backend pragmas. *)


(***************************************************************************)
(* Each of these pragmas can be cited with a BY or a USE.  The pragma that *)
(* is added to the context of an obligation most recently is the one whose *)
(* effects are triggered.                                                  *)
(***************************************************************************)

(***************************************************************************)
(* The following pragmas should be used only as a last resource.  They are *)
(* dependent upon the particular backend provers, and are unlikely to have *)
(* any effect if the set of backend provers changes.  Moreover, they are   *)
(* meaningless to a reader of the proof.                                   *)
(***************************************************************************)


(**************************************************************************)
(* Backend pragma: use the SMT solver for arithmetic.                     *)
(*                                                                        *)
(* This method exists under this name for historical reasons.             *)
(**************************************************************************)

SimpleArithmetic == TRUE (*{ by (prover:"smt3") }*)


(**************************************************************************)
(* Backend pragma: SMT solver                                             *)
(*                                                                        *)
(* This method translates the proof obligation to SMTLIB2. The supported  *)
(* fragment includes first-order logic, set theory, functions and         *)
(* records.                                                               *)
(* SMT calls the smt-solver with the default timeout of 5 seconds         *)
(* while SMTT(n) calls the smt-solver with a timeout of n seconds.        *)
(*                                                                        *)
(* SMTT also accepts a string argument of the form "rN" to bound the      *)
(* underlying Z3 solver by a deterministic \`rlimit\` budget instead of a    *)
(* wall-clock timeout, e.g. SMTT("r5"). N is a multiple of a fixed base    *)
(* resource count, so a small readable budget like "r5" is meaningful.     *)
(* Unlike a wall-clock timeout, an \`rlimit\` budget does not depend on CPU  *)
(* speed or load, so the proof's pass/fail outcome reproduces on any       *)
(* machine and every rerun (for a fixed Z3 build); how long it takes to    *)
(* consume the budget still varies by machine. This is Z3-specific.        *)
(**************************************************************************)

SMT == TRUE (*{ by (prover:"smt3") }*)
SMTT(X) == TRUE (*{ by (prover:"smt3"; timeout:@) }*)


(**************************************************************************)
(* Backend pragma: CVC4 SMT solver                                        *)
(*                                                                        *)
(* These methods translate the proof obligation to SMTLIB2 and call CVC4. *)
(**************************************************************************)

(* The CVC3* methods are here for backward compatibility. They call CVC4. *)
CVC3 == TRUE (*{ by (prover: "cvc33") }*)
CVC3T(X) == TRUE (*{ by (prover:"cvc33"; timeout:@) }*)

CVC4 == TRUE (*{ by (prover: "cvc33") }*)
CVC4T(X) == TRUE (*{ by (prover:"cvc33"; timeout:@) }*)


(**************************************************************************)
(* Backend pragma: Yices SMT solver                                       *)
(*                                                                        *)
(* This method translates the proof obligation to Yices native language.  *)
(**************************************************************************)

Yices == TRUE (*{ by (prover: "yices3") }*)
YicesT(X) == TRUE (*{ by (prover:"yices3"; timeout:@) }*)

(**************************************************************************)
(* Backend pragma: veriT SMT solver                                       *)
(*                                                                        *)
(* This method translates the proof obligation to SMTLIB2 and calls veriT.*)
(**************************************************************************)

veriT == TRUE (*{ by (prover: "verit") }*)
veriTT(X) == TRUE (*{ by (prover:"verit"; timeout:@) }*)

(**************************************************************************)
(* Backend pragma: Zipperposition solver                                  *)
(*                                                                        *)
(* This method translates the proof obligation to TPTP and                *)
(* calls Zipperposition.                                                  *)
(**************************************************************************)

Zipper == TRUE (*{ by (prover: "zipper") }*)
ZipperT(X) == TRUE (*{ by (prover:"zipper"; timeout:@) }*)

(**************************************************************************)
(* Backend pragma: Z3 SMT solver                                          *)
(*                                                                        *)
(* This method translates the proof obligation to SMTLIB2 and calls Z3.   *)
(* Z3 is used by default but you can also explicitly call it.             *)
(* Z3T(n) bounds Z3 by a wall-clock timeout of n seconds, while Z3T("rN")  *)
(* bounds it by a deterministic \`rlimit\` budget of N base units, which      *)
(* reproduces the same outcome on any machine (see SMTT).                   *)
(**************************************************************************)

Z3 == TRUE (*{ by (prover: "z33") }*)
Z3T(X) == TRUE (*{ by (prover:"z33"; timeout:@) }*)

(**************************************************************************)
(* Backend pragma: SPASS superposition prover                             *)
(*                                                                        *)
(* This method translates the proof obligation to the DFG format language *)
(* supported by the ATP SPASS. The translation is based on the SMT one.   *)
(**************************************************************************)

Spass == TRUE (*{ by (prover: "spass") }*)
SpassT(X) == TRUE (*{ by (prover:"spass"; timeout:@) }*)

(**************************************************************************)
(* Backend pragma: The PTL propositional linear time temporal logic       *)
(* prover.  It currently is the LS4 backend.                              *)
(*                                                                        *)
(* This method translates the negetation of the proof obligation to       *)
(* Seperated Normal Form (TRP++ format) and checks for unsatisfiability   *)
(**************************************************************************)

LS4 == TRUE (*{ by (prover: "ls4") }*)
LS4T(X) == TRUE (*{ by (prover: "ls4"; timeout:@) }*)
PTL == TRUE (*{ by (prover: "ls4") }*)

(**************************************************************************)
(* Backend pragma: Zenon with different timeouts (default is 10 seconds)  *)
(*                                                                        *)
(**************************************************************************)

Zenon == TRUE (*{ by (prover:"zenon") }*)
ZenonT(X) == TRUE (*{ by (prover:"zenon"; timeout:@) }*)

(********************************************************************)
(* Backend pragma: Isabelle with different timeouts and tactics     *)
(*  (default is 30 seconds/auto)                                    *)
(********************************************************************)

Isa == TRUE (*{ by (prover:"isabelle") }*)
IsaT(X) ==  TRUE (*{ by (prover:"isabelle"; timeout:@) }*)
IsaM(X) ==  TRUE (*{ by (prover:"isabelle"; tactic:@) }*)
IsaMT(X,Y) ==  TRUE (*{ by (prover:"isabelle"; tactic:@; timeout:@) }*)

(***************************************************************************)
(* The following theorem expresses the (useful implication of the) law of  *)
(* set extensionality, which can be written as                             *)
(*                                                                         *)
(*    THEOREM  \\A S, T : (S = T) <=> (\\A x : (x \\in S) <=> (x \\in T))      *)
(*                                                                         *)
(* Theorem SetExtensionality is sometimes required by the SMT backend for  *)
(* reasoning about sets. It is usually counterproductive to include        *)
(* theorem SetExtensionality in a BY clause for the Zenon or Isabelle      *)
(* backends. Instead, use the pragma IsaWithSetExtensionality to instruct  *)
(* the Isabelle backend to use the rule of set extensionality.             *)
(***************************************************************************)
IsaWithSetExtensionality == TRUE
           (*{ by (prover:"isabelle"; tactic:"(auto intro: setEqualI)")}*)

THEOREM SetExtensionality == \\A S,T : (\\A x : x \\in S <=> x \\in T) => S = T
OBVIOUS

(***************************************************************************)
(* The following theorem is needed to deduce NotInSetS \\notin SetS from    *)
(* the definition                                                          *)
(*                                                                         *)
(*   NotInSetS == CHOOSE v : v \\notin SetS                                 *)
(***************************************************************************)
THEOREM NoSetContainsEverything == \\A S : \\E x : x \\notin S
OBVIOUS (*{by (isabelle "(auto intro: inIrrefl)")}*)
-----------------------------------------------------------------------------



(********************************************************************)
(********************************************************************)
(********************************************************************)


(********************************************************************)
(* Old versions of Zenon and Isabelle pragmas below                 *)
(* (kept for compatibility)                                         *)
(********************************************************************)


(**************************************************************************)
(* Backend pragma: Zenon with different timeouts (default is 10 seconds)  *)
(*                                                                        *)
(**************************************************************************)

SlowZenon == TRUE (*{ by (prover:"zenon"; timeout:20) }*)
SlowerZenon == TRUE (*{ by (prover:"zenon"; timeout:40) }*)
VerySlowZenon == TRUE (*{ by (prover:"zenon"; timeout:80) }*)
SlowestZenon == TRUE (*{ by (prover:"zenon"; timeout:160) }*)



(********************************************************************)
(* Backend pragma: Isabelle's automatic search ("auto")             *)
(*                                                                  *)
(* This pragma bypasses Zenon. It is useful in situations involving *)
(* essentially simplification and equational reasoning.             *)
(* Default imeout for all isabelle tactics is 30 seconds.           *)
(********************************************************************)
Auto == TRUE (*{ by (prover:"isabelle"; tactic:"auto") }*)
SlowAuto == TRUE (*{ by (prover:"isabelle"; tactic:"auto"; timeout:120) }*)
SlowerAuto == TRUE (*{ by (prover:"isabelle"; tactic:"auto"; timeout:480) }*)
SlowestAuto == TRUE (*{ by (prover:"isabelle"; tactic:"auto"; timeout:960) }*)

(********************************************************************)
(* Backend pragma: Isabelle's "force" tactic                        *)
(*                                                                  *)
(* This pragma bypasses Zenon. It is useful in situations involving *)
(* quantifier reasoning.                                            *)
(********************************************************************)
Force == TRUE (*{ by (prover:"isabelle"; tactic:"force") }*)
SlowForce == TRUE (*{ by (prover:"isabelle"; tactic:"force"; timeout:120) }*)
SlowerForce == TRUE (*{ by (prover:"isabelle"; tactic:"force"; timeout:480) }*)
SlowestForce == TRUE (*{ by (prover:"isabelle"; tactic:"force"; timeout:960) }*)

(***********************************************************************)
(* Backend pragma: Isabelle's "simplification" tactics                 *)
(*                                                                     *)
(* These tactics simplify the goal before running one of the automated *)
(* tactics. They are often necessary for obligations involving record  *)
(* or tuple projections. Use the SimplfyAndSolve tactic unless you're  *)
(* sure you can get away with just Simplification                      *)
(***********************************************************************)
SimplifyAndSolve        == TRUE
    (*{ by (prover:"isabelle"; tactic:"clarsimp auto?") }*)
SlowSimplifyAndSolve    == TRUE
    (*{ by (prover:"isabelle"; tactic:"clarsimp auto?"; timeout:120) }*)
SlowerSimplifyAndSolve  == TRUE
    (*{ by (prover:"isabelle"; tactic:"clarsimp auto?"; timeout:480) }*)
SlowestSimplifyAndSolve == TRUE
    (*{ by (prover:"isabelle"; tactic:"clarsimp auto?"; timeout:960) }*)

Simplification == TRUE (*{ by (prover:"isabelle"; tactic:"clarsimp") }*)
SlowSimplification == TRUE
    (*{ by (prover:"isabelle"; tactic:"clarsimp"; timeout:120) }*)
SlowerSimplification  == TRUE
    (*{ by (prover:"isabelle"; tactic:"clarsimp"; timeout:480) }*)
SlowestSimplification == TRUE
    (*{ by (prover:"isabelle"; tactic:"clarsimp"; timeout:960) }*)

(**************************************************************************)
(* Backend pragma: Isabelle's tableau prover ("blast")                    *)
(*                                                                        *)
(* This pragma bypasses Zenon and uses Isabelle's built-in theorem        *)
(* prover, Blast. It is almost never better than Zenon by itself, but     *)
(* becomes very useful in combination with the Auto pragma above. The     *)
(* AutoBlast pragma first attempts Auto and then uses Blast to prove what *)
(* Auto could not prove. (There is currently no way to use Zenon on the   *)
(* results left over from Auto.)                                          *)
(**************************************************************************)
Blast == TRUE (*{ by (prover:"isabelle"; tactic:"blast") }*)
SlowBlast == TRUE (*{ by (prover:"isabelle"; tactic:"blast"; timeout:120) }*)
SlowerBlast == TRUE (*{ by (prover:"isabelle"; tactic:"blast"; timeout:480) }*)
SlowestBlast == TRUE (*{ by (prover:"isabelle"; tactic:"blast"; timeout:960) }*)

AutoBlast == TRUE (*{ by (prover:"isabelle"; tactic:"auto, blast") }*)


(**************************************************************************)
(* Backend pragmas: multi-back-ends                                       *)
(*                                                                        *)
(* These pragmas just run a bunch of back-ends one after the other in the *)
(* hope that one will succeed. This saves time and effort for the user at *)
(* the expense of computation time.                                       *)
(**************************************************************************)

(* CVC3 goes first because it's bundled with TLAPS, then the other SMT
   solvers are unlikely to succeed if CVC3 fails, so we run zenon and
   Isabelle before them. *)
AllProvers == TRUE (*{
    by (prover:"cvc33")
    by (prover:"zenon")
    by (prover:"isabelle"; tactic:"auto")
    by (prover:"spass")
    by (prover:"smt3")
    by (prover:"yices3")
    by (prover:"verit")
    by (prover:"z33")
    by (prover:"isabelle"; tactic:"force")
    by (prover:"isabelle"; tactic:"(auto intro: setEqualI)")
    by (prover:"isabelle"; tactic:"clarsimp auto?")
    by (prover:"isabelle"; tactic:"clarsimp")
    by (prover:"isabelle"; tactic:"auto, blast")
  }*)
AllProversT(X) == TRUE (*{
    by (prover:"cvc33"; timeout:@)
    by (prover:"zenon"; timeout:@)
    by (prover:"isabelle"; tactic:"auto"; timeout:@)
    by (prover:"spass"; timeout:@)
    by (prover:"smt3"; timeout:@)
    by (prover:"yices3"; timeout:@)
    by (prover:"verit"; timeout:@)
    by (prover:"z33"; timeout:@)
    by (prover:"isabelle"; tactic:"force"; timeout:@)
    by (prover:"isabelle"; tactic:"(auto intro: setEqualI)"; timeout:@)
    by (prover:"isabelle"; tactic:"clarsimp auto?"; timeout:@)
    by (prover:"isabelle"; tactic:"clarsimp"; timeout:@)
    by (prover:"isabelle"; tactic:"auto, blast"; timeout:@)
  }*)

AllSMT == TRUE (*{
    by (prover:"cvc33")
    by (prover:"smt3")
    by (prover:"yices3")
    by (prover:"verit")
    by (prover:"z33")
  }*)
AllSMTT(X) == TRUE (*{
    by (prover:"cvc33"; timeout:@)
    by (prover:"smt3"; timeout:@)
    by (prover:"yices3"; timeout:@)
    by (prover:"verit"; timeout:@)
    by (prover:"z33"; timeout:@)
  }*)

AllIsa == TRUE (*{
    by (prover:"isabelle"; tactic:"auto")
    by (prover:"isabelle"; tactic:"force")
    by (prover:"isabelle"; tactic:"(auto intro: setEqualI)")
    by (prover:"isabelle"; tactic:"clarsimp auto?")
    by (prover:"isabelle"; tactic:"clarsimp")
    by (prover:"isabelle"; tactic:"auto, blast")
  }*)
AllIsaT(X) == TRUE (*{
    by (prover:"isabelle"; tactic:"auto"; timeout:@)
    by (prover:"isabelle"; tactic:"force"; timeout:@)
    by (prover:"isabelle"; tactic:"(auto intro: setEqualI)"; timeout:@)
    by (prover:"isabelle"; tactic:"clarsimp auto?"; timeout:@)
    by (prover:"isabelle"; tactic:"clarsimp"; timeout:@)
    by (prover:"isabelle"; tactic:"auto, blast"; timeout:@)
  }*)


(**************************************************************************)
(* The pragma ExpandEnabled invokes expansion of the operator ENABLED.    *)
(*                                                                        *)
(* The pragma ExpandCdot invokes expansion of the operator \\cdot.         *)
(*                                                                        *)
(* The pragma AutoUSE invokes automated expansion of definitions,         *)
(* for both of ExpandEnabled and ExpandCdot, when each is present.        *)
(*                                                                        *)
(* The pragma Lambdify invokes expansion of the operators                 *)
(* ENABLED and \\cdot to an intermediate form with bound VARIABLES,        *)
(* which is a form before introducing rigid quantifiers.                  *)
(* The pragma Lambdify is sound for occurrences of ENABLED and \\cdot      *)
(* that are not nested.                                                   *)
(**************************************************************************)
ExpandENABLED == TRUE  (*{ by (prover:"expandenabled") }*)
ExpandCdot == TRUE  (*{ by (prover:"expandcdot") }*)
AutoUSE == TRUE  (*{ by (prover:"autouse") }*)
Lambdify == TRUE  (*{ by (prover:"lambdify") }*)
ENABLEDaxioms == TRUE  (*{ by (prover:"enabledaxioms") }*)
LevelComparison == TRUE  (*{ by (prover:"levelcomparison") }*)

(* The operators EnabledWrapper and CdotWrapper occur in an intermediate  *)
(* representation within TLAPM.                                           *)
EnabledWrapper(Op(_)) == FALSE
CdotWrapper(Op(_)) == FALSE

(***************************************************************************)
(* The following may be used in a \`BY ONLY ThmName\` for unit testing the   *)
(* triviality checks in TLAPM.                                             *)
(***************************************************************************)
Trivial == TRUE  (*{ by (prover:"trivial") }*)


=============================================================================

The material below is obsolete: the TLA proof rules below are superseded by
the PTL decision procedure, and their formulation is unsound for the semantics
of temporal reasoning that TLAPS adopts.

----------------------------------------------------------------------------
(***************************************************************************)
(*                           TEMPORAL LOGIC                                *)
(*                                                                         *)
(* The following rules are intended to be used when TLAPS handles temporal *)
(* logic.  They will not work now.  Moreover when temporal reasoning is    *)
(* implemented, these rules may be changed or omitted, and additional      *)
(* rules will probably be added.  However, they are included mainly so     *)
(* their names will be defined, preventing the use of identifiers that are *)
(* likely to produce name clashes with future versions of this module.     *)
(***************************************************************************)


(***************************************************************************)
(* The following proof rules (and their names) are from the paper "The     *)
(* Temporal Logic of Actions".                                             *)
(***************************************************************************)
THEOREM RuleTLA1 == ASSUME STATE P, STATE f,
                           P /\\ (f' = f) => P'
                    PROVE  []P <=> P /\\ [][P => P']_f

THEOREM RuleTLA2 == ASSUME STATE P, STATE Q, STATE f, STATE g,
                           ACTION A, ACTION B,
                           P /\\ [A]_f => Q /\\ [B]_g
                    PROVE  []P /\\ [][A]_f => []Q /\\ [][B]_g

THEOREM RuleINV1 == ASSUME STATE I, STATE F,  ACTION N,
                           I /\\ [N]_F => I'
                    PROVE  I /\\ [][N]_F => []I

THEOREM RuleINV2 == ASSUME STATE I, STATE f, ACTION N
                    PROVE  []I => ([][N]_f <=> [][N /\\ I /\\ I']_f)

THEOREM RuleWF1 == ASSUME STATE P, STATE Q, STATE f, ACTION N, ACTION A,
                          P /\\ [N]_f => (P' \\/ Q'),
                          P /\\ <<N /\\ A>>_f => Q',
                          P => ENABLED <<A>>_f
                   PROVE  [][N]_f /\\ WF_f(A) => (P ~> Q)

THEOREM RuleSF1 == ASSUME STATE P, STATE Q, STATE f,
                          ACTION N, ACTION A, TEMPORAL F,
                          P /\\ [N]_f => (P' \\/ Q'),
                          P /\\ <<N /\\ A>>_f => Q',
                          []P /\\ [][N]_f /\\ []F => <> ENABLED <<A>>_f
                   PROVE  [][N]_f /\\ SF_f(A) /\\ []F => (P ~> Q)

(***************************************************************************)
(* The rules WF2 and SF2 in "The Temporal Logic of Actions" are obtained   *)
(* from the following two rules by the following substitutions: \`.         *)
(*                                                                         *)
(*          ___        ___         _______________                         *)
(*      M <- M ,   g <- g ,  EM <- ENABLED <<M>>_g       .'                *)
(***************************************************************************)
THEOREM RuleWF2 == ASSUME STATE P, STATE f, STATE g, STATE EM,
                          ACTION A, ACTION B, ACTION N, ACTION M,
                          TEMPORAL F,
                          <<N /\\ B>>_f => <<M>>_g,
                          P /\\ P' /\\ <<N /\\ A>>_f /\\ EM => B,
                          P /\\ EM => ENABLED A,
                          [][N /\\ ~B]_f /\\ WF_f(A) /\\ []F /\\ <>[]EM => <>[]P
                   PROVE  [][N]_f /\\ WF_f(A) /\\ []F => []<><<M>>_g \\/ []<>(~EM)

THEOREM RuleSF2 == ASSUME STATE P, STATE f, STATE g, STATE EM,
                          ACTION A, ACTION B, ACTION N, ACTION M,
                          TEMPORAL F,
                          <<N /\\ B>>_f => <<M>>_g,
                          P /\\ P' /\\ <<N /\\ A>>_f /\\ EM => B,
                          P /\\ EM => ENABLED A,
                          [][N /\\ ~B]_f /\\ SF_f(A) /\\ []F /\\ []<>EM => <>[]P
                   PROVE  [][N]_f /\\ SF_f(A) /\\ []F => []<><<M>>_g \\/ <>[](~EM)


(***************************************************************************)
(* The following rule is a special case of the general temporal logic      *)
(* proof rule STL4 from the paper "The Temporal Logic of Actions".  The    *)
(* general rule is for arbitrary temporal formulas F and G, but it cannot  *)
(* yet be handled by TLAPS.                                                *)
(***************************************************************************)
THEOREM RuleInvImplication ==
  ASSUME STATE F, STATE G,
         F => G
  PROVE  []F => []G
PROOF OMITTED

(***************************************************************************)
(* The following rule is a special case of rule TLA2 from the paper "The   *)
(* Temporal Logic of Actions".                                             *)
(***************************************************************************)
THEOREM RuleStepSimulation ==
  ASSUME STATE I, STATE f, STATE g,
         ACTION M, ACTION N,
         I /\\ I' /\\ [M]_f => [N]_g
  PROVE  []I /\\ [][M]_f => [][N]_g
PROOF OMITTED

(***************************************************************************)
(* The following may be used to invoke a decision procedure for            *)
(* propositional temporal logic.                                           *)
(***************************************************************************)
PropositionalTemporalLogic == TRUE
=============================================================================
`,
  ],
  [
    "Bags",
    `----------------------------- MODULE Bags --------------------------------
(**************************************************************************)
(* A bag, also called a multiset, is a set that can contain multiple      *)
(* copies of the same element.  A bag can have infinitely many elements,  *)
(* but only finitely many copies of any single element.                   *)
(*                                                                        *)
(* We represent a bag in the usual way as a function whose range is a     *)
(* subset of the positive integers.  An element e belongs to bag B iff e  *)
(* is in the domain of B, in which case bag B contains B[e] copies of e.  *)
(**************************************************************************)
LOCAL INSTANCE Naturals

IsABag(B) ==
  (************************************************************************)
  (* True iff B is a bag.                                                 *)
  (************************************************************************)
  B \\in [DOMAIN B -> {n \\in Nat : n > 0}]

BagToSet(B) == DOMAIN B
  (************************************************************************)
  (* The set of elements at least one copy of which is in B.              *)
  (************************************************************************)

SetToBag(S) == [e \\in S |-> 1]
  (************************************************************************)
  (* The bag that contains one copy of every element of the set S.        *)
  (************************************************************************)

BagIn(e,B) == e \\in BagToSet(B)
  (************************************************************************)
  (* The \\in operator for bags.                                           *)
  (************************************************************************)

EmptyBag == SetToBag({})

B1 (+) B2  ==
  (************************************************************************)
  (* The union of bags B1 and B2.                                         *)
  (************************************************************************)
  [e \\in (DOMAIN B1) \\cup (DOMAIN B2) |->
      (IF e \\in DOMAIN B1 THEN B1[e] ELSE 0)
    + (IF e \\in DOMAIN B2 THEN B2[e] ELSE 0) ]

B1 (-) B2  ==
  (************************************************************************)
  (* The bag B1 with the elements of B2 removed--that is, with one copy   *)
  (* of an element removed from B1 for each copy of the same element in   *)
  (* B2.  If B2 has at least as many copies of e as B1, then B1 (-) B2    *)
  (* has no copies of e.                                                  *)
  (************************************************************************)
  LET B == [e \\in DOMAIN B1 |-> IF e \\in DOMAIN B2 THEN B1[e] - B2[e]
                                                   ELSE B1[e]]
  IN  [e \\in {d \\in DOMAIN B : B[d] > 0} |-> B[e]]

LOCAL Sum(f) ==
        (******************************************************************)
        (* The sum of f[x] for all x in DOMAIN f.  The definition assumes *)
        (* that f is a Nat-valued function and that f[x] equals 0 for all *)
        (* but a finite number of elements x in DOMAIN f.                 *)
        (******************************************************************)
        LET DSum[S \\in SUBSET DOMAIN f] ==
               LET elt == CHOOSE e \\in S : TRUE
               IN  IF S = {} THEN 0
                             ELSE f[elt] + DSum[S \\ {elt}]
        IN  DSum[DOMAIN f]

BagUnion(S) ==
  (************************************************************************)
  (* The bag union of all elements of the set S of bags.                  *)
  (************************************************************************)
  [e \\in UNION {BagToSet(B) : B \\in S} |->
    Sum( [B \\in S |-> IF BagIn(e, B) THEN B[e] ELSE 0] ) ]

B1 \\sqsubseteq B2  ==
  (************************************************************************)
  (* The subset operator for bags.  B1 \\sqsubseteq B2 iff, for all e, bag *)
  (* B2 has at least as many copies of e as bag B1 does.                  *)
  (************************************************************************)
  /\\ (DOMAIN B1) \\subseteq (DOMAIN B2)
  /\\ \\A e \\in DOMAIN B1 : B1[e] \\leq B2[e]

SubBag(B) ==
  (************************************************************************)
  (* The set of all subbags of bag B.                                     *)
  (*                                                                      *)
  (* The following definition is not the one described in the TLA+ book,  *)
  (* but rather one that TLC can evaluate.                                *)
  (************************************************************************)

  LET RemoveFromDom(x, f) == [y \\in (DOMAIN f) \\ {x} |-> f[y]]
      Combine(x, BagSet) ==
         BagSet \\cup
          {[y \\in (DOMAIN f) \\cup {x} |-> IF y = x THEN i ELSE f[y]] :
                f \\in BagSet, i \\in 1..B[x]}
      Biggest == LET Range1 == {B[x] : x \\in DOMAIN B}
                 IN  IF Range1 = {} THEN 0
                                   ELSE CHOOSE r \\in Range1 :
                                           \\A s \\in Range1 : r \\geq s
      RSB[BB \\in UNION {[S -> 1..Biggest] : S \\in SUBSET DOMAIN B}] ==
        IF BB = << >> THEN {<< >>}
                      ELSE LET x == CHOOSE x \\in DOMAIN BB : TRUE
                           IN  Combine(x, RSB[RemoveFromDom(x, BB)])
  IN RSB[B]

  (*******************  Here is the definition from the TLA+ book. ********
  LET AllBagsOfSubset ==
        (******************************************************************)
        (* The set of all bags SB such that BagToSet(SB) \\subseteq        *)
        (* BagToSet(B).                                                   *)
        (******************************************************************)
        UNION {[SB -> {n \\in Nat : n > 0}] : SB \\in SUBSET BagToSet(B)}
  IN  {SB \\in AllBagsOfSubset : \\A e \\in DOMAIN SB : SB[e] \\leq B[e]}
  ***************************************************************************)

BagOfAll(F(_), B) ==
  (************************************************************************)
  (* The bag analog of the set {F(x) : x \\in B} for a set B. It's the bag *)
  (* that contains, for each element e of B, one copy of F(e) for every   *)
  (* copy of e in B. This defines a bag iff, for any value v, the set of  *)
  (* e in B such that F(e) = v is finite.                                 *)
  (************************************************************************)
  [e \\in {F(d) : d \\in BagToSet(B)} |->
     Sum( [d \\in BagToSet(B) |-> IF F(d) = e THEN B[d] ELSE 0] ) ]

BagCardinality(B) ==
  (************************************************************************)
  (* If B is a finite bag (one such that BagToSet(B) is a finite set),    *)
  (* then this is its cardinality (the total number of copies of elements *)
  (* in B).  Its value is unspecified if B is infinite.                   *)
  (************************************************************************)
  Sum(B)


=============================================================================

(* Last modified on Fri 26 Jan 2007 at  8:45:03 PST by lamport *)

 6 Apr 99 : Modified version for standard module set
 7 Dec 98 : Corrected error found by Stephan Merz.
 6 Dec 98 : Modified comments based on suggestions by Lyle Ramshaw.
 5 Dec 98 : Initial version.
`,
  ],
  [
    "BagsTheorems",
    `---------------------------- MODULE BagsTheorems ---------------------------
(**************************************************************************)
(* A bag, also called a multiset, is a set that can contain multiple      *)
(* copies of the same element.  A bag can have infinitely many elements,  *)
(* but only finitely many copies of any single element.                   *)
(*                                                                        *)
(* We represent a bag in the usual way as a function whose range is a     *)
(* subset of the positive integers.  An element e belongs to bag B iff e  *)
(* is in the domain of B, in which case bag B contains B[e] copies of e.  *)
(**************************************************************************)
EXTENDS Bags

LOCAL INSTANCE Naturals

CopiesIn(e, B) ==
  (************************************************************************)
  (* If B is a bag, then CopiesIn(e, B) is the number of copies of e in   *)
  (* B. If ~BagIn(e, B), then CopiesIn(e, B) = 0.                         *)
  (************************************************************************)
  IF BagIn(e, B) THEN B[e] ELSE 0

Scaling(n, B) ==
  (************************************************************************)
  (* If B is a bag, then Scaling(e, B) is the Bag containing the same     *)
  (* elements of B with n times their copies                              *)
  (************************************************************************)
  IF n>0 THEN [i \\in DOMAIN B |-> n*B[i] ] ELSE EmptyBag


(***************************************************************************)
(* Converts a sequence into a bag                                          *)
(***************************************************************************)

SeqToBag(seq) == [ x \\in Range(seq) |-> Cardinality({i \\in DOMAIN seq: seq[i]=x}) ]


(***************************************************************************)
(* \\sqsubseteq is a PARTIAL ORDER relattion                                *)
(***************************************************************************)

(*Reflexivity*)
THEOREM Bags_SqsubsetPO_Reflexivity ==
  ASSUME NEW B, IsABag(B)
  PROVE B \\sqsubseteq B

(*Antisymmetry*)
THEOREM Bags_SqsubseteqPO_AntiSymmetry ==
  ASSUME NEW A, NEW B, IsABag(A), IsABag(B),
         A \\sqsubseteq B, B \\sqsubseteq A
  PROVE A = B

(*Transitivity*)
THEOREM Bags_SqsubseteqPO_Transitivity ==
  ASSUME NEW A, NEW B, NEW C, IsABag(A), IsABag(B), IsABag(C),
         A \\sqsubseteq B, B \\sqsubseteq C
  PROVE A \\sqsubseteq C

(***************************************************************************)
(* Lemmas on EmptyBags                                                     *)
(***************************************************************************)

THEOREM Bags_EmptyBag ==
  ASSUME NEW B, IsABag(B)
  PROVE  /\\ IsABag(EmptyBag)
         /\\ B=EmptyBag <=> DOMAIN B ={}
         /\\ DOMAIN EmptyBag ={}
         /\\ EmptyBag \\sqsubseteq B
         /\\ \\A e: ~BagIn(e, EmptyBag)

(***************************************************************************)
(* Lemmas on Scaling Operator for Bags                                     *)
(***************************************************************************)

THEOREM Bags_Scaling ==
  ASSUME NEW B, IsABag(B), NEW n \\in Nat, NEW m \\in Nat
  PROVE /\\ IsABag(Scaling(n, B))
        /\\ Scaling(n, EmptyBag)=EmptyBag
        /\\ Scaling(0, B)=EmptyBag
        /\\ Scaling(1, B)= B
        /\\ Scaling(n*m, B) = Scaling(n, Scaling(m, B))
        /\\ n>0 => DOMAIN(Scaling(n, B)) = DOMAIN B

(***************************************************************************)
(* SetToBag and BagToSet are inverse of each other                         *)
(***************************************************************************)

THEOREM Bags_Inverse ==
  ASSUME NEW S
  PROVE  BagToSet(SetToBag(S))=S

THEOREM Bags_Inverse1 ==
  ASSUME NEW B, IsABag(B)
  PROVE  SetToBag(BagToSet(B)) \\sqsubseteq B

(***************************************************************************)
(* SetToBag Preserves Equality                                             *)
(***************************************************************************)

THEOREM Bags_SetToBagEquality ==
  ASSUME NEW A, NEW B
  PROVE  A=B <=> SetToBag(A)=SetToBag(B)

(***************************************************************************)
(* Union of Bags                                                           *)
(***************************************************************************)

THEOREM Bags_Union ==
  ASSUME NEW B1, NEW B2, IsABag(B1), IsABag(B2)
  PROVE  /\\ IsABag(B1 (+) B2)
         /\\ DOMAIN(B1 (+) B2) = DOMAIN B1 \\cup DOMAIN B2
         /\\ \\A e : CopiesIn(e, B1(+)B2) = CopiesIn(e,B1) + CopiesIn(e,B2)

(***************************************************************************)
(* Difference of Bags                                                      *)
(***************************************************************************)

THEOREM Bags_Difference ==
  ASSUME NEW B1, NEW B2, IsABag(B1), IsABag(B2)
  PROVE  /\\ IsABag(B1 (-) B2)
         /\\ DOMAIN (B1 (-) B2) =
               {e \\in DOMAIN B1 : e \\notin DOMAIN B2 \\/ B1[e] > B2[e]}
         /\\ \\A e : CopiesIn(e, B1 (-) B2) =
                   IF BagIn(e, B1(-)B2) THEN CopiesIn(e,B1) - CopiesIn(e,B2)
                   ELSE 0

(***************************************************************************)
(* Union is commutative.                                                   *)
(***************************************************************************)

THEOREM Bags_UnionCommutative ==
  ASSUME NEW B1, NEW B2, IsABag(B1), IsABag(B2)
  PROVE  B1(+)B2 = B2(+)B1

(***************************************************************************)
(* Unon is associative.                                                    *)
(***************************************************************************)
THEOREM Bags_UnionAssociative ==
  ASSUME NEW B1, NEW B2, NEW B3, IsABag(B1), IsABag(B2), IsABag(B3)
  PROVE  (B1(+)B2) (+) B3 = B1 (+) (B2(+)B3)

(***************************************************************************)
(* Given Bags B1, B2 then B1 \\sqsubseteq B1(+)B2                           *)
(***************************************************************************)

THEOREM Bags_UnionSqSubset ==
  ASSUME NEW B1, NEW B2, IsABag(B1), IsABag(B2)
  PROVE  B1 \\sqsubseteq B1(+)B2

(***************************************************************************)
(* Scaling is monotonic in the scaling factor.                             *)
(***************************************************************************)

THEOREM Bags_ScalingMonotonic ==
  ASSUME NEW B, IsABag(B), NEW n \\in Nat, NEW m \\in Nat, m <= n
  PROVE  Scaling(m, B) \\sqsubseteq Scaling(n, B)

(***************************************************************************)
(* Given Bags A and B, A(-)B \\sqsubseteq A                                 *)
(***************************************************************************)

THEOREM Bags_DifferenceSqsubset ==
  ASSUME NEW A, NEW B, IsABag(A), IsABag(B)
  PROVE  A(-)B \\sqsubseteq A

(***************************************************************************)
(* EmptyBag is the additive identity.                                      *)
(***************************************************************************)

THEOREM Bags_EmptyBagOperations ==
  ASSUME NEW B, IsABag(B)
  PROVE  /\\ B (+) EmptyBag = B
         /\\ B (-) EmptyBag = B

(***************************************************************************)
(* SetToBag of a set is a bag.                                             *)
(***************************************************************************)

THEOREM Bags_SetToBagIsABag ==
  ASSUME NEW S
  PROVE  IsABag(SetToBag(S))

(***************************************************************************)
(* CopiesIn is monotone w.r.t \\sqsubseteq                                  *)
(***************************************************************************)

THEOREM Bags_CopiesInBagsInMonotone ==
  ASSUME NEW B1, NEW B2, NEW e, IsABag(B1), IsABag(B2), B1 \\sqsubseteq B2
  PROVE  /\\ BagIn(e, B1) => BagIn(e, B2)
         /\\ CopiesIn(e, B1) <= CopiesIn(e, B2)

(***************************************************************************)
(* Given Bag B and Natural n, CopiesIn(e, Scaling(n, B))=n*CopiesIn(e, B)  *)
(***************************************************************************)

THEOREM Bags_CopiesInScaling ==
  ASSUME NEW B, IsABag(B), NEW n \\in Nat, NEW e
  PROVE  CopiesIn(e, Scaling(n, B)) = n*CopiesIn(e, B)

(***************************************************************************)
(* Given set S, CopiesIn(e, SetToBag(S))=IF e \\in B THEN 1 ELSE 0          *)
(***************************************************************************)

THEOREM Bags_CopiesInSetToBag ==
  ASSUME NEW B, NEW e
  PROVE  CopiesIn(e, SetToBag(B))=IF e \\in B THEN 1 ELSE 0

(***************************************************************************)
(* Given sequence seq, SeqToBag(seq) is a Bag                              *)
(***************************************************************************)

THEOREM Bags_IsABagSeqToBag ==
  ASSUME NEW S, NEW seq \\in Seq(S)
  PROVE  IsABag(SeqToBag(seq))

=============================================================================
`,
  ],
  [
    "FiniteSets",
    `---------------------------- MODULE FiniteSets -----------------------------
LOCAL INSTANCE Naturals
LOCAL INSTANCE Sequences
  (*************************************************************************)
  (* Imports the definitions from Naturals and Sequences, but doesn't      *)
  (* export them.                                                          *)
  (*************************************************************************)

IsFiniteSet(S) ==
  (*************************************************************************)
  (* A set S is finite iff there is a finite sequence containing all its   *)
  (* elements.                                                             *)
  (*************************************************************************)
  \\E seq \\in Seq(S) : \\A s \\in S : \\E n \\in 1..Len(seq) : seq[n] = s

Cardinality(S) ==
  (*************************************************************************)
  (* Cardinality is defined only for finite sets.                          *)
  (*************************************************************************)
  LET CS[T \\in SUBSET S] == IF T = {} THEN 0
                                      ELSE 1 + CS[T \\ {CHOOSE x : x \\in T}]
  IN  CS[S]
=============================================================================
`,
  ],
  [
    "FiniteSetTheorems",
    `------------------------- MODULE FiniteSetTheorems --------------------------
(***************************************************************************)
(* \`^{\\large\\bf \\vspace{12pt}                                              *)
(*  Facts about finite sets and their cardinality.                         *)
(*  Originally contributed by Tom Rodeheffer, MSR.                         *)
(*  \\vspace{12pt}}^'                                                       *)
(***************************************************************************)

EXTENDS FiniteSets, Integers, Functions, WellFoundedInduction

(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* A set S is finite iff there exists a natural number n such that there   *)
(* exist a surjection (or a bijection) from 1..n to S.                     *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)

LEMMA FS_NatSurjection ==
  ASSUME NEW S
  PROVE  IsFiniteSet(S) <=> \\E n \\in Nat : ExistsSurjection(1..n,S)

LEMMA FS_NatBijection ==
  ASSUME NEW S
  PROVE  IsFiniteSet(S) <=> \\E n \\in Nat : ExistsBijection(1..n,S)


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* If there exists n \\in Nat such that a bijection exists from 1..n to S,  *)
(* then Cardinality(S) = n.                                                *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)

LEMMA FS_CountingElements ==
  ASSUME NEW S, NEW n \\in Nat, ExistsBijection(1..n,S)
  PROVE  Cardinality(S) = n


(***************************************************************************)
(* Corollary: a surjection from 1..n to S provides a cardinality bound.    *)
(***************************************************************************)
THEOREM FS_SurjCardinalityBound ==
  ASSUME NEW S, NEW n \\in Nat, ExistsSurjection(1..n, S)
  PROVE  Cardinality(S) <= n


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* For any finite set S, Cardinality(S) \\in Nat. Moreover, there is a      *)
(* bijection from 1 .. Cardinality(S) to S.                                *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM FS_CardinalityType ==
  ASSUME NEW S, IsFiniteSet(S)
  PROVE  /\\ Cardinality(S) \\in Nat
         /\\ ExistsBijection(1..Cardinality(S), S)


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* The image of a finite set under a bijection is finite.                  *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM FS_Bijection ==
  ASSUME NEW S, NEW T, IsFiniteSet(S), ExistsBijection(S,T)
  PROVE  /\\ IsFiniteSet(T)
         /\\ Cardinality(T) = Cardinality(S)

THEOREM FS_SameCardinalityBij ==
  ASSUME NEW S, NEW T, IsFiniteSet(S), IsFiniteSet(T),
         Cardinality(S) = Cardinality(T)
  PROVE  ExistsBijection(S,T)


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* Any surjection between two finite sets of equal cardinality is          *)
(* an injection.                                                           *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM FS_SurjSameCardinalityImpliesInj ==
  ASSUME NEW S, NEW T, IsFiniteSet(S), Cardinality(S) = Cardinality(T),
         NEW f \\in Surjection(S,T)
  PROVE  f \\in Injection(S,T)


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* The image of a finite set is finite.                                    *)
(* NB: Note that any function is a surjection on its range by theorem      *)
(*     Fun_RangeProperties.                                                *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM FS_Surjection ==
  ASSUME NEW S, NEW T, NEW f \\in Surjection(S,T), IsFiniteSet(S)
  PROVE  /\\ IsFiniteSet(T)
         /\\ Cardinality(T) <= Cardinality(S)
         /\\ Cardinality(T) = Cardinality(S) <=> f \\in Injection(S,T)

THEOREM FS_Image ==
  ASSUME NEW S, IsFiniteSet(S), NEW Op(_)
  PROVE  LET T == {Op(x) : x \\in S}
         IN  /\\ IsFiniteSet(T)
             /\\ Cardinality(T) <= Cardinality(S)

(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* Symmetric theorem for injections and the pigeonhole principle.          *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM FS_Injection ==
  ASSUME NEW S, NEW T, NEW f \\in Injection(S,T), IsFiniteSet(T)
  PROVE  /\\ IsFiniteSet(S)
         /\\ Cardinality(S) <= Cardinality(T)
         /\\ Cardinality(S) = Cardinality(T) <=> f \\in Surjection(S,T)

THEOREM FS_PigeonHole ==
  ASSUME NEW S, IsFiniteSet(S),
         NEW T, IsFiniteSet(T), Cardinality(T) < Cardinality(S),
         NEW f \\in [S -> T]
  PROVE  \\E x,y \\in S : x # y /\\ f[x] = f[y]


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* The cardinality of a finite set S is 0 iff S is empty.                  *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM FS_EmptySet ==
  /\\ IsFiniteSet({})
  /\\ Cardinality({}) = 0
  /\\ \\A S : IsFiniteSet(S) => (Cardinality(S) = 0 <=> S = {})


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* If S is finite, so are S \\cup {x} and S \\ {x}.                          *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM FS_AddElement ==
  ASSUME NEW S, NEW x, IsFiniteSet(S)
  PROVE  /\\ IsFiniteSet(S \\cup {x})
         /\\ Cardinality(S \\cup {x}) =
            IF x \\in S THEN Cardinality(S) ELSE Cardinality(S)+1

THEOREM FS_RemoveElement ==
  ASSUME NEW S, NEW x, IsFiniteSet(S)
  PROVE  /\\ IsFiniteSet(S \\ {x})
         /\\ Cardinality(S \\ {x}) =
            IF x \\in S THEN Cardinality(S)-1 ELSE Cardinality(S)


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* In particular, a singleton set is finite.                               *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM FS_Singleton ==
  /\\ \\A x : IsFiniteSet({x}) /\\ Cardinality({x}) = 1
  /\\ \\A S : IsFiniteSet(S) => (Cardinality(S) = 1 <=> \\E x: S = {x})


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* Any subset of a finite set is finite.                                   *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM FS_Subset ==
  ASSUME NEW S, IsFiniteSet(S), NEW T \\in SUBSET S
  PROVE  /\\ IsFiniteSet(T)
         /\\ Cardinality(T) <= Cardinality(S)
         /\\ Cardinality(S) = Cardinality(T) => S = T


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* a..b is a finite set for any a,b \\in Int.                               *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM FS_Interval ==
  ASSUME NEW a \\in Int, NEW b \\in Int
  PROVE  /\\ IsFiniteSet(a..b)
         /\\ Cardinality(a..b) = IF a > b THEN 0 ELSE b-a+1

THEOREM FS_BoundedSetOfNaturals ==
  ASSUME NEW S \\in SUBSET Nat, NEW n \\in Nat,
         \\A s \\in S : s <= n
  PROVE  /\\ IsFiniteSet(S)
         /\\ Cardinality(S) \\leq n+1


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* Induction for finite sets.                                              *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)

THEOREM FS_Induction ==
  ASSUME NEW S, IsFiniteSet(S),
         NEW P(_), P({}),
         ASSUME NEW T \\in SUBSET S, IsFiniteSet(T), P(T), NEW x \\in S \\ T
         PROVE  P(T \\cup {x})
  PROVE  P(S)


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* The finite subsets form a well-founded ordering with respect to strict  *)
(* set inclusion.                                                          *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)

FiniteSubsetsOf(S) == { T \\in SUBSET S : IsFiniteSet(T) }
StrictSubsetOrdering(S) == { ss \\in (SUBSET S) \\X (SUBSET S) :
                                ss[1] \\subseteq ss[2] /\\ ss[1] # ss[2] }

LEMMA FS_FiniteSubsetsOfFinite ==
  ASSUME NEW S, IsFiniteSet(S)
  PROVE  FiniteSubsetsOf(S) = SUBSET S


(*****************************************************************************)
(*  The formulation of the following theorem doesn't require S being finite. *)
(*  If S is finite, it implies                                               *)
(*       IsWellFoundedOn(StrictSubsetOrdering(S), SUBSET S)                  *)
(*  using lemma FS_FiniteSubsetsOfFinite.                                    *)
(*****************************************************************************)
THEOREM FS_StrictSubsetOrderingWellFounded ==
  ASSUME NEW S
  PROVE  IsWellFoundedOn(StrictSubsetOrdering(S), FiniteSubsetsOf(S))


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* Well-founded induction for finite subsets.                              *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)

THEOREM FS_WFInduction ==
  ASSUME NEW P(_), NEW S, IsFiniteSet(S),
         ASSUME NEW T \\in SUBSET S,
                \\A U \\in (SUBSET T) \\ {T} : P(U)
         PROVE  P(T)
  PROVE  P(S)


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* The union of two finite sets is finite.                                 *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM FS_Union ==
  ASSUME NEW S, IsFiniteSet(S),
         NEW T, IsFiniteSet(T)
  PROVE  /\\ IsFiniteSet(S \\cup T)
         /\\ Cardinality(S \\cup T) =
               Cardinality(S) + Cardinality(T) - Cardinality(S \\cap T)


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* Corollary: two majorities intersect. More precisely, any two subsets    *)
(* of a finite set U such that the sum of cardinalities of the subsets     *)
(* exceeds that of U must have non-empty intersection.                     *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM FS_MajoritiesIntersect ==
  ASSUME NEW U, NEW S, NEW T, IsFiniteSet(U),
         S \\subseteq U, T \\subseteq U,
         Cardinality(S) + Cardinality(T) > Cardinality(U)
  PROVE  S \\cap T # {}


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* The intersection of a finite set with an arbitrary set is finite.       *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)


THEOREM FS_Intersection ==
  ASSUME NEW S, IsFiniteSet(S), NEW T
  PROVE  /\\ IsFiniteSet(S \\cap T)
         /\\ IsFiniteSet(T \\cap S)
         /\\ Cardinality(S \\cap T) <= Cardinality(S)
         /\\ Cardinality(T \\cap S) <= Cardinality(S)


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* The difference between a finite set and an arbitrary set is finite.     *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM FS_Difference ==
  ASSUME NEW S, NEW T, IsFiniteSet(S)
  PROVE /\\ IsFiniteSet(S \\ T)
        /\\ Cardinality(S \\ T) = Cardinality(S) - Cardinality(S \\cap T)


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* The union of a finite number of finite sets is finite.                  *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM FS_UNION ==
  ASSUME NEW S, IsFiniteSet(S), \\A T \\in S : IsFiniteSet(T)
  PROVE  IsFiniteSet(UNION S)


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* The product of two finite sets is finite.                               *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM FS_Product ==
  ASSUME NEW S, IsFiniteSet(S),
         NEW T, IsFiniteSet(T)
  PROVE  /\\ IsFiniteSet(S \\X T)
         /\\ Cardinality(S \\X T) = Cardinality(S) * Cardinality(T)


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* The powerset of a finite set is finite.                                 *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM FS_SUBSET ==
  ASSUME NEW S, IsFiniteSet(S)
  PROVE  /\\ IsFiniteSet(SUBSET S)
         /\\ Cardinality(SUBSET S) = 2^Cardinality(S)

=============================================================================
\\* Modification History
\\* Last modified Wed Jan 08 17:43:30 CET 2020 by merz
\\* Last modified Thu Jul 04 15:15:07 CEST 2013 by bhargav
\\* Last modified Tue Jun 04 11:44:51 CEST 2013 by bhargav
\\* Last modified Fri May 03 12:02:51 PDT 2013 by tomr
\\* Created Fri Oct 05 15:04:18 PDT 2012 by tomr
`,
  ],
  [
    "Folds",
    `------------------------------- MODULE Folds -------------------------------
(***************************************************************************)
(* This module provides a general framework for folding operations over    *)
(* sets with flexible element selection and transformation.                *)
(*                                                                         *)
(* The main operator MapThenFoldSet is the foundation for many other       *)
(* folding operations found in:                                            *)
(*   - FiniteSetsExt.FoldSet (simplified for sets)                         *)
(*   - Functions.FoldFunction (specialized for functions)                  *)
(*   - SequencesExt.FoldSeq (specialized for sequences)                    *)
(*                                                                         *)
(***************************************************************************)

MapThenFoldSet(op(_,_), base, f(_), choose(_), S) ==
(******************************************************************************)
(* Starting from base, apply op to f(x), for all x \\in S, by choosing the set *)
(* elements with \`choose\`. If there are multiple ways for choosing an element,*)
(* op should be associative and commutative. Otherwise, the result may depend *)
(* on the concrete implementation of \`choose\`.                                *)
(*                                                                            *)
(* FoldSet, a simpler version for sets is contained in FiniteSetsEx.          *)
(* FoldFunction, a simpler version for functions is contained in Functions.   *)
(* FoldSequence, a simpler version for sequences is contained in SequencesExt.*)
(*                                                                            *)
(* Example:                                                                   *)
(*                                                                            *)
(*  MapThenFoldSet(LAMBDA x,y: x \\cup y,                                      *)
(*                 {},                                                        *)
(*                 LAMBDA x: {{x}},                                           *)
(*                 LAMBDA set: CHOOSE x \\in set: TRUE,                        *)
(*                 {1,2})                                                     *)
(*       = {{1},{2}}                                                          *)
(******************************************************************************)
  LET iter[s \\in SUBSET S] ==
        IF s = {} THEN base
        ELSE LET x == choose(s)
             IN  op(f(x), iter[s \\ {x}])
  IN  iter[S]


=============================================================================
`,
  ],
  [
    "Functions",
    `------------------------------ MODULE Functions -----------------------------
(***************************************************************************)
(* \`^{\\large\\bf \\vspace{12pt}                                              *)
(*  Notions about functions including injection, surjection, and bijection.*)
(*  Originally contributed by Tom Rodeheffer, MSR.                         *)
(*  \\vspace{12pt}}^'                                                       *)
(***************************************************************************)

EXTENDS Integers, Folds

(***************************************************************************)
(* Restriction of a function to a set (should be a subset of the domain).  *)
(***************************************************************************)
Restrict(f,S) == [ x \\in S |-> f[x] ]

(***************************************************************************)
(* Restriction of a function to the subset of its domain satisfying a      *)
(* test predicate.                                                         *)
(*                                                                         *)
(* Example:                                                                *)
(*   (LET f == (0 :> "a" @@ 1 :> "b" @@ 2 :> "c")                          *)
(*    IN  RestrictDomain(f, LAMBDA x : x \\in {0,2}))                       *)
(*   = (0 :> "a" @@ 2 :> "c")                                              *)
(***************************************************************************)
RestrictDomain(f, Test(_)) == Restrict(f, {x \\in DOMAIN f : Test(x)})

(***************************************************************************)
(* Restriction of a function to the subset of its domain for which the     *)
(* function values satisfy a test predicate.                               *)
(*                                                                         *)
(* Example:                                                                *)
(*   (LET f == ("a" :> 0 @@ "b" :> 1 @@ "c" :> 2)                          *)
(*    IN  RestrictValues(f, LAMBDA y : y \\in {0,2}))                       *)
(*   = ("a" :> 0 @@ "b" :> 2)                                              *)
(*                                                                         *)
(* This is similar to the operator SelectSeq from the standard Sequences   *)
(* module and related to standard "filter" functions in functional         *)
(* programming. However, SelectSeq produces sequences, whereas             *)
(* RestrictValues will in general not. For example,                        *)
(*                                                                         *)
(*   RestrictValues([0,1,2], LAMBDA y : y \\in {0,2})                       *)
(*   = (1 :> 0 @@ 3 :> 2)                                                  *)
(***************************************************************************)
RestrictValues(f, Test(_)) ==
  LET S == {x \\in DOMAIN f : Test(f[x])}
  IN  Restrict(f, S)

(***************************************************************************)
(* Check if a function narrow is a restriction of a function wide, i.e.    *)
(* Is the domain of narrow a subset of that of wide, and does the          *)
(* projection of wide on the domain of narrow have the same image as       *)
(* narrow does.                                                            *)
(*                                                                         *)
(* Examples:                                                               *)
(*   IsRestriction([one |-> 1], [one |-> 1, two |-> 2])                    *)
(*   IsRestriction([one |-> 1], [one |-> 1])                               *)
(*  ~IsRestriction([one |-> 1, two |-> 2], [one |-> 1, two |-> 3])         *)
(*  ~IsRestriction([one |-> 1], [2 |-> two])                               *)
(*  ~IsRestriction([one |-> 1, two |-> 2], [two |-> 2])                    *)
(***************************************************************************)
IsRestriction(narrow, wide) ==
    /\\ DOMAIN narrow \\subseteq DOMAIN wide 
    /\\ \\A x \\in DOMAIN narrow \\intersect DOMAIN wide: narrow[x] = wide[x]

(***************************************************************************)
(* Range of a function.                                                    *)
(* Note: The image of a set under function f can be defined as             *)
(*       Range(Restrict(f,S)).                                             *)
(***************************************************************************)
Range(f) == { f[x] : x \\in DOMAIN f }

(***************************************************************************)
(* Assuming DOMAIN f \\subseteq DOMAIN g, apply the binary operation T to   *)
(* the corresponding elements of the two functions f and g.                *)
(*                                                                         *)
(* Example:                                                                *)
(*   LET f == ("a" :> 0 @@ "b" :> 1 @@ "c" :> 2)                           *)
(*       g == ("a" :> 1 @@ "b" :> 1 @@ "c" :> 3)                           *)
(*   IN Pointwise(f,g,+) = ("a" :> 1 @@ "b" :> 2 @@ "c" :> 5 )             *)
(***************************************************************************)
Pointwise(f, g, T(_,_)) == [ e \\in DOMAIN f |-> T(f[e], g[e]) ]

(***************************************************************************)
(* The inverse of a function.                                              *)
(* Example:                                                                *)
(*    LET f == ("a" :> 0 @@ "b" :> 1 @@ "c" :> 2)                          *)
(*    IN Inverse(f, DOMAIN f, Range(f)) =                                  *)
(*                                 (0 :> "a" @@ 1 :> "b" @@ 2 :> "c")      *)
(* Example:                                                                *)
(*    LET f == ("a" :> 0 @@ "b" :> 1 @@ "c" :> 2)                          *)
(*    IN Inverse(f, DOMAIN f, {1,3}) =                                     *)
(*                                 1 :> "b" @@ 3 :> "a")                   *)
(***************************************************************************)
Inverse(f,S,T) == [t \\in T |-> CHOOSE s \\in S : t \\in Range(f) => f[s] = t]

(***************************************************************************)
(* The inverse of a function.                                              *)
(***************************************************************************)
AntiFunction(f) == Inverse(f, DOMAIN f, Range(f))

(***************************************************************************)
(* A function is injective iff it maps each element in its domain to a     *)
(* distinct element.                                                       *)
(*                                                                         *)
(* This definition is overridden by TLC in the Java class Functions.java   *)
(* The operator is overridden by the Java method with the same name.       *)
(***************************************************************************)
IsInjective(f) == \\A a,b \\in DOMAIN f : f[a] = f[b] => a = b

(***************************************************************************)
(* Set of injections between two sets.                                     *)
(***************************************************************************)
Injection(S,T) == { M \\in [S -> T] : IsInjective(M) }


(***************************************************************************)
(* A map is a surjection iff for each element in the range there is some   *)
(* element in the domain that maps to it.                                  *)
(***************************************************************************)
Surjection(S,T) == { M \\in [S -> T] : \\A t \\in T : \\E s \\in S : M[s] = t }


(***************************************************************************)
(* A map is a bijection iff it is both an injection and a surjection.      *)
(***************************************************************************)
Bijection(S,T) == Injection(S,T) \\cap Surjection(S,T)


(***************************************************************************)
(* An injection, surjection, or bijection exists if the corresponding set  *)
(* is nonempty.                                                            *)
(***************************************************************************)
ExistsInjection(S,T)  == Injection(S,T) # {}
ExistsSurjection(S,T) == Surjection(S,T) # {}
ExistsBijection(S,T)  == Bijection(S,T) # {}

--------------------------------------------------------------------------------

(***************************************************************************)
(* Applies the binary operator op on the elements f[i] for i \\in indices,  *)
(* a subset of DOMAIN f, in an unspecified order, starting from value      *)
(* base. The result is                                                     *)
(*    op(f[i],op(f[j], ..., op(f[k],base) ...))                            *)
(* where i,j,k range over the sets indices.                                *)
(*                                                                         *)
(* op should be associative and commutative, because we can not assume a   *)
(* particular ordering of i, j, and k                                      *)
(*                                                                         *)
(* Example:                                                                *)
(*  FoldFunctionOnSet(LAMBDA x,y: {x} \\cup y, {}, <<1,2>>, {}) = {}        *)
(***************************************************************************)
FoldFunctionOnSet(op(_,_), base, fun, indices) ==
  MapThenFoldSet(op, base, LAMBDA i : fun[i], LAMBDA s: CHOOSE x \\in s : TRUE, indices)

(***************************************************************************)
(* Special case of the above where indices = DOMAIN fun. In other words,   *)
(* the values f[i] for all i \\in DOMAIN fun, are combined using the binary *)
(* operator op, in an unspecified order.                                   *)
(*                                                                         *)
(* Example:                                                                *)
(*  FoldFunction(LAMBDA x,y: {x} \\cup y, {}, <<1,2,1>>) = {1,2}            *)
(***************************************************************************)
FoldFunction(op(_,_), base, fun) ==
  FoldFunctionOnSet(op, base, fun, DOMAIN fun)

(***************************************************************************)
(* Sum the values f[i] for i \\in indices, a subset of DOMAIN f.            *)
(*                                                                         *)
(* Example:                                                                *)
(*  SumFunctionOnSet(<<4,5,6>>, {1,2}) = 9                                 *)
(*  SumFunction(<<4,5,6>>) = 15                                            *)
(***************************************************************************)
SumFunctionOnSet(fun, indices) == FoldFunctionOnSet(+, 0, fun, indices)
SumFunction(fun) == SumFunctionOnSet(fun, DOMAIN fun)

=============================================================================
\\* Created Thu Apr 11 10:30:48 PDT 2013 by tomr
`,
  ],
  [
    "FunctionTheorems",
    `------------------------ MODULE FunctionTheorems ----------------------------
(***************************************************************************)
(* \`^{\\large \\vspace{12pt}                                                 *)
(*  Proofs of facts about functions.                                       *)
(*  Originally contributed by Tom Rodeheffer, MSR.                         *)
(*  \\vspace{12pt}}^'                                                       *)
(***************************************************************************)

EXTENDS Functions, Integers, FiniteSets

(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* Function restriction.                                                   *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM Fun_RestrictProperties ==
  ASSUME NEW S, NEW T, NEW f \\in [S -> T], NEW A \\in SUBSET S
  PROVE  /\\ Restrict(f,A) \\in [A -> T]
         /\\ \\A x \\in A : Restrict(f,A)[x] = f[x]

(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* Range of a function.                                                    *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM Fun_RangeProperties ==
  ASSUME NEW S, NEW T, NEW f \\in [S -> T]
  PROVE  /\\ Range(f) \\subseteq T
         /\\ \\A y \\in Range(f) : \\E x \\in S : f[x] = y
         /\\ f \\in Surjection(S, Range(f))


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* Inverse of a function.                                                  *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM Fun_InverseProperties ==
  ASSUME NEW S, NEW T, NEW f \\in [S -> T]
  PROVE  /\\ (S = {} => T = {}) => Inverse(f,S,T) \\in [T -> S]
         /\\ \\A y \\in Range(f) : f[Inverse(f,S,T)[y]] = y


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* Introduction rules for injections, surjections, bijections.             *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM Fun_IsInj ==
  ASSUME NEW S, NEW T, NEW F \\in [S -> T],
         \\A a,b \\in S : F[a] = F[b] => a = b
  PROVE  F \\in Injection(S,T)

THEOREM Fun_IsSurj ==
  ASSUME NEW S, NEW T, NEW F \\in [S -> T],
         \\A t \\in T : \\E s \\in S : F[s] = t
  PROVE  F \\in Surjection(S,T)

THEOREM Fun_IsBij ==
  ASSUME NEW S, NEW T, NEW F,
         \\/ F \\in Injection(S,T)
         \\/ (F \\in [S -> T] /\\ \\A a,b \\in S : F[a] = F[b] => a = b),

         \\/ F \\in Surjection(S,T)
         \\/ (F \\in [S -> T] /\\ \\A t \\in T : \\E s \\in S : F[s] = t)
  PROVE  F \\in Bijection(S,T)



(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* Properties of injections, surjections, and bijections.                  *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM Fun_InjectionProperties ==
  ASSUME NEW S, NEW T, NEW F \\in Injection(S,T)
  PROVE  /\\ F \\in [S -> T]
         /\\ \\A a,b \\in S : F[a] = F[b] => a = b

THEOREM Fun_SurjectionProperties ==
  ASSUME NEW S, NEW T, NEW F \\in Surjection(S,T)
  PROVE  /\\ F \\in [S -> T]
         /\\ \\A t \\in T : \\E s \\in S : F[s] = t
         /\\ Range(F) = T

THEOREM Fun_BijectionProperties ==
  ASSUME NEW S, NEW T, NEW F \\in Bijection(S,T)
  PROVE  /\\ F \\in [S -> T]
         /\\ F \\in Injection(S,T)
         /\\ F \\in Surjection(S,T)
         /\\ \\A a,b \\in S : F[a] = F[b] => a = b
         /\\ \\A t \\in T : \\E s \\in S : F[s] = t


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* A surjection in [S -> T] such that there is no surjection from any      *)
(* subset of S to T is a bijection.                                        *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM Fun_SmallestSurjectionIsBijection ==
  ASSUME NEW S, NEW T, NEW f \\in Surjection(S,T),
         \\A U \\in SUBSET S : U # S => Surjection(U,T) = {}
  PROVE  f \\in Bijection(S,T)


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* Transitivity of injections, surjections, bijections.                    *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM Fun_InjTransitive ==
  ASSUME NEW S, NEW T, NEW U,
         NEW F \\in Injection(S,T),
         NEW G \\in Injection(T,U)
  PROVE  [s \\in S |-> G[F[s]]] \\in Injection(S,U)

THEOREM Fun_SurjTransitive ==
  ASSUME NEW S, NEW T, NEW U,
         NEW F \\in Surjection(S,T),
         NEW G \\in Surjection(T,U)
  PROVE  [s \\in S |-> G[F[s]]] \\in Surjection(S,U)

THEOREM Fun_BijTransitive ==
  ASSUME NEW S, NEW T, NEW U,
         NEW F \\in Bijection(S,T),
         NEW G \\in Bijection(T,U)
  PROVE  [s \\in S |-> G[F[s]]] \\in Bijection(S,U)


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* The inverse of a surjection is an injection and vice versa.             *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM Fun_SurjInverse ==
  ASSUME NEW S, NEW T, NEW f \\in Surjection(S,T)
  PROVE  Inverse(f,S,T) \\in Injection(T,S)

THEOREM Fun_InjInverse ==
  ASSUME NEW S, NEW T, NEW f \\in Injection(S,T), S = {} => T = {}
  PROVE  Inverse(f,S,T) \\in Surjection(T,S)


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* Properties of the inverse of a bijection.                               *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM Fun_BijInverse ==
  ASSUME NEW S, NEW T, NEW f \\in Bijection(S,T)
  PROVE  /\\ Inverse(f,S,T) \\in Bijection(T,S)
         /\\ \\A s \\in S : Inverse(f,S,T)[f[s]] = s
         /\\ Inverse(Inverse(f,S,T), T,S) = f

(***************************************************************************)
(* We cannot conclude that a function f is a bijection if its inverse is   *)
(* a bijection, and the following is a counter-example.                    *)
(*                                                                         *)
(*   S = {1,2} T = {3,4}                                                   *)
(*   f = [x \\in S |-> 3]                                                   *)
(*                                                                         *)
(* Then, Inverse(f,S,T) can very well be (3 :> 1) @@ (4 :> 2), which is a  *)
(* bijection although f is not.                                            *)
(***************************************************************************)

(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* The restriction of a bijection is a bijection.                          *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM Fun_BijRestrict ==
  ASSUME NEW S, NEW T, NEW F \\in Bijection(S,T),
         NEW R \\in SUBSET S
  PROVE  Restrict(F, R) \\in Bijection(R, Range(Restrict(F, R)))


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* Given F an injection from S to T, then F is a bijection from S to F(S). *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM Fun_InjMeansBijImage ==
  ASSUME NEW S, NEW T, NEW F \\in Injection(S,T)
  PROVE  F \\in Bijection(S, Range(F))


-----------------------------------------------------------------------------
(***************************************************************************)
(* \`^{\\large \\vspace{12pt}                                                 *)
(*  Facts about exists jections.                                           *)
(*  \\vspace{12pt}}^'                                                       *)
(***************************************************************************)



(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* Definitions restated as facts.                                          *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM Fun_ExistsInj ==
  \\A S,T : ExistsInjection(S,T)  <=>  Injection(S,T) # {}

THEOREM Fun_ExistsSurj ==
  \\A S,T : ExistsSurjection(S,T)  <=>  Surjection(S,T) # {}

THEOREM Fun_ExistsBij ==
  \\A S,T : ExistsBijection(S,T)  <=>  Bijection(S,T) # {}


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* There is a surjection from any set S to any non-empty subset T of S.    *)
(* (Note that there cannot be a surjection to {} except if S is empty.)    *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM Fun_ExistsSurjSubset ==
  ASSUME NEW S, NEW T \\in SUBSET S, T # {}
  PROVE  ExistsSurjection(S,T)


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* If there is a surjection from S to T, then there is an injection from T *)
(* to S.                                                                   *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM Fun_ExistsSurjMeansExistsRevInj ==
  ASSUME NEW S, NEW T, ExistsSurjection(S,T)
  PROVE  ExistsInjection(T,S)


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* ExistsBijection is reflexive, symmetric, and transitive.                *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM Fun_ExistsBijReflexive ==
  ASSUME NEW S
  PROVE  ExistsBijection(S,S)

THEOREM Fun_ExistsBijSymmetric ==
  ASSUME NEW S, NEW T, ExistsBijection(S,T)
  PROVE  ExistsBijection(T,S)

THEOREM Fun_ExistsBijTransitive ==
  ASSUME NEW S, NEW T, NEW U, ExistsBijection(S,T), ExistsBijection(T,U)
  PROVE  ExistsBijection(S,U)


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* Existence of injections and surjections is reflexive and transitive.    *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM Fun_ExistsInjReflexive ==
  ASSUME NEW S
  PROVE  ExistsInjection(S,S)

THEOREM Fun_ExistsSurjReflexive ==
  ASSUME NEW S
  PROVE  ExistsSurjection(S,S)

THEOREM Fun_ExistsInjTransitive ==
  ASSUME NEW S, NEW T, NEW U,
         ExistsInjection(S,T), ExistsInjection(T,U)
  PROVE  ExistsInjection(S,U)

THEOREM Fun_ExistsSurjTransitive ==
  ASSUME NEW S, NEW T, NEW U,
         ExistsSurjection(S,T), ExistsSurjection(T,U)
  PROVE  ExistsSurjection(S,U)


-----------------------------------------------------------------------------
(***************************************************************************)
(* \`^{\\large \\vspace{12pt}                                                 *)
(* The Cantor-Bernstein-Schroeder theorem.                                 *)
(*  \\vspace{12pt}}^'                                                       *)
(***************************************************************************)


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* If there exists an injection from S to T, where T is a subset of S,     *)
(* then there exists a bijection from S to T.                              *)
(*                                                                         *)
(* A lemma for the Cantor-Bernstein-Schroeder theorem.                     *)
(*                                                                         *)
(* This proof is formalized from                                           *)
(* \`^\\url{http://www.proofwiki.org/wiki/Cantor-Bernstein-Schroeder\\_Theorem/Lemma}^' *)
(* retrieved April 29, 2013.                                               *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM Fun_CantorBernsteinSchroeder_Lemma ==
  ASSUME NEW S, NEW T, T \\subseteq S, ExistsInjection(S,T)
  PROVE  ExistsBijection(S,T)


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* If an injection exists from S to T and an injection exists from T to S, *)
(* then there is a bijection from S to T.                                  *)
(*                                                                         *)
(* This is the Cantor-Bernstein-Schroeder theorem.                         *)
(*                                                                         *)
(* This proof is formalized from                                           *)
(* \`^\\url{http://www.proofwiki.org/wiki/Cantor-Bernstein-Schroeder_Theorem/Proof_5}^' *)
(* retrieved April 29, 2013.                                               *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM Fun_CantorBernsteinSchroeder ==
  ASSUME NEW S, NEW T,
         ExistsInjection(S,T), ExistsInjection(T,S)
  PROVE  ExistsBijection(S,T)


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* Applications of the Cantor-Bernstein-Schroeder Theorem.                 *)
(* If there exists an injection f: A->B and a surjection g: A->B, then     *)
(* there exists a bijection between A and B.                               *)
(* Also, if there are surjections between A and B, then there is a         *)
(* bijection.                                                              *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)

THEOREM Fun_ExistInjAndSurjThenBij ==
  ASSUME NEW S, NEW T,
         ExistsInjection(S,T), ExistsSurjection(S,T)
  PROVE  ExistsBijection(S,T)

THEOREM Fun_ExistSurjAndSurjThenBij ==
  ASSUME NEW S, NEW T,
         ExistsSurjection(S,T), ExistsSurjection(T,S)
  PROVE  ExistsBijection(S,T)


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* Equivalences for ExistsBijection.                                       *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM Fun_ExistsBijEquiv ==
  ASSUME NEW S, NEW T
  PROVE  /\\ ExistsBijection(S,T) <=> ExistsBijection(T,S)
         /\\ ExistsBijection(S,T) <=> ExistsInjection(S,T) /\\ ExistsInjection(T,S)
         /\\ ExistsBijection(S,T) <=> ExistsInjection(S,T) /\\ ExistsSurjection(S,T)
         /\\ ExistsBijection(S,T) <=> ExistsInjection(T,S) /\\ ExistsSurjection(T,S)
         /\\ ExistsBijection(S,T) <=> ExistsSurjection(S,T) /\\ ExistsSurjection(T,S)


-----------------------------------------------------------------------------
(***************************************************************************)
(* \`^{\\large \\vspace{12pt}                                                 *)
(*  Facts about jections involving 1..n.                                   *)
(*  \\vspace{12pt}}^'                                                       *)
(***************************************************************************)


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* There is a bijection from 1..b-a+1 to a..b for integers a,b with a <= b.*)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM Fun_ExistsBijInterval ==
  ASSUME NEW a \\in Int, NEW b \\in Int, a <= b
  PROVE  ExistsBijection(1 .. b-a+1, a .. b)


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* There is an injection from 1..n to 1..m iff n \\leq m.                   *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM Fun_NatInjLeq ==
  ASSUME NEW n \\in Nat, NEW m \\in Nat
  PROVE  ExistsInjection(1..n,1..m) <=> n \\leq m


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* If a surjection from 1..n to S exists (for some n \\in Nat) then a       *)
(* bijection from 1..m to S exists (for some m \\in Nat) and m \\leq n.      *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM Fun_NatSurjImpliesNatBij ==
  ASSUME NEW S, NEW n \\in Nat, ExistsSurjection(1..n,S)
  PROVE  \\E m \\in Nat : ExistsBijection(1..m,S) /\\ m \\leq n


(***************************************************************************)
(* Simple corollary.                                                       *)
(***************************************************************************)
THEOREM Fun_NatSurjEquivNatBij ==
  ASSUME NEW S
  PROVE  (\\E n \\in Nat : ExistsSurjection(1..n,S))
    <=>  (\\E m \\in Nat : ExistsBijection(1..m,S))


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* For any set S, given n, m \\in Nat such that bijections exist from 1..n  *)
(* to S and from 1..m to S, then it must be the case that n = m.           *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM Fun_NatBijSame ==
  ASSUME NEW S,
         NEW n \\in Nat, ExistsBijection(1..n,S),
         NEW m \\in Nat, ExistsBijection(1..m,S)
  PROVE  n = m


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* S is empty iff there exists a bijection from 1..0 to S.                 *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM Fun_NatBijEmpty ==
  ASSUME NEW S
  PROVE  ExistsBijection(1..0,S) <=> S = {}


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* S is a singleton iff there exists a bijection from 1..1 to S.           *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM Fun_NatBijSingleton ==
  ASSUME NEW S
  PROVE  ExistsBijection(1..1,S) <=> \\E s : S = {s}


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* If there exists a bijection from 1..m to S (for some m \\in Nat), then   *)
(* there exists a bijection from 1..n to T (for some n \\in Nat), where T   *)
(* is a subset of S.  Furthermore n \\leq m.                                *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM Fun_NatBijSubset ==
  ASSUME NEW S, NEW m \\in Nat, ExistsBijection(1..m,S),
         NEW T \\in SUBSET S
  PROVE  \\E n \\in Nat : ExistsBijection(1..n,T) /\\ n \\leq m


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* If there exists a bijection from 1..m to S (for some m \\in Nat), then   *)
(* there exists a bijection from 1..(m+1) to S \\cup {x}, where x \\notin S. *)
(*                                                                         *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM Fun_NatBijAddElem ==
  ASSUME NEW S, NEW m \\in Nat, ExistsBijection(1..m,S),
         NEW x, x \\notin S
  PROVE  ExistsBijection(1..(m+1), S \\cup {x})


(***************************************************************************)
(* \`.  .'                                                                  *)
(*                                                                         *)
(* If there exists a bijection from 1..m to S (for some m \\in Nat), then   *)
(* there exists a bijection from 1..(m-1) to S \\ {x}, where x \\in S.       *)
(*                                                                         *)
(*                                                                         *)
(* \`.  .'                                                                  *)
(***************************************************************************)
THEOREM Fun_NatBijSubElem ==
  ASSUME NEW S, NEW m \\in Nat, ExistsBijection(1..m,S),
         NEW x, x \\in S
  PROVE  ExistsBijection(1..(m-1), S \\ {x})

-----------------------------------------------------------------------------

(***************************************************************************)
(* Folding a function for an empty set of indices yields the base value.   *)
(***************************************************************************)
THEOREM FoldFunctionOnSetEmpty ==
  ASSUME NEW op(_,_), NEW base, NEW fun
  PROVE  FoldFunctionOnSet(op, base, fun, {}) = base 

(***************************************************************************)
(* Folding a function for a non-empty set of indices corresponds to        *)
(* applying the binary operator to f[i], for some i \\in indices, and the   *)
(* result of recursing for the set indices \\ {i}.                          *)
(***************************************************************************)
THEOREM FoldFunctionOnSetNonempty ==
  ASSUME NEW op(_,_), NEW base, NEW fun, 
         NEW indices, indices # {}, IsFiniteSet(indices)
  PROVE  \\E i \\in indices : FoldFunctionOnSet(op, base, fun, indices) = 
            op(fun[i], FoldFunctionOnSet(op, base, fun, indices \\ {i}))

(***************************************************************************)
(* The type of folding a function corresponds to the type associated with  *)
(* the binary operator that underlies the fold.                            *)
(***************************************************************************)
THEOREM FoldFunctionOnSetType ==
  ASSUME NEW Typ, NEW op(_,_), NEW base \\in Typ,
         \\A t,u \\in Typ : op(t,u) \\in Typ,
         NEW indices, IsFiniteSet(indices), NEW fun,
         \\A i \\in indices : fun[i] \\in Typ
  PROVE FoldFunctionOnSet(op, base, fun, indices) \\in Typ

(***************************************************************************)
(* Folding two functions that agree on every element of the set of indices *)
(* yields the same value.                                                  *)
(***************************************************************************)
THEOREM FoldFunctionOnSetEqual ==
  ASSUME NEW op(_,_), NEW base, NEW f, NEW g,
         NEW indices, IsFiniteSet(indices),
         \\A i \\in indices : f[i] = g[i]
  PROVE  FoldFunctionOnSet(op, base, f, indices) = 
         FoldFunctionOnSet(op, base, g, indices)

(***************************************************************************)
(* If the binary operator is associative and commutative, the result of    *)
(* folding a function over a non-empty set corresponds to applying the     *)
(* operator to an arbitrary element of the set and the result of folding   *)
(* the function over the remainder of the set.                             *)
(***************************************************************************)
THEOREM FoldFunctionOnSetAC ==
  ASSUME NEW Typ, NEW op(_,_), NEW base \\in Typ,
         \\A t,u \\in Typ : op(t,u) \\in Typ,
         \\A t,u \\in Typ : op(t,u) = op(u,t),
         \\A t,u,v \\in Typ : op(t, op(u,v)) = op(op(t,u),v),
         NEW indices, IsFiniteSet(indices), NEW i \\in indices, NEW fun,
         \\A j \\in indices : fun[j] \\in Typ
  PROVE FoldFunctionOnSet(op, base, fun, indices) =
        op(fun[i], FoldFunctionOnSet(op, base, fun, indices \\ {i}))

\\* reformulation in terms of adding an index to the set
THEOREM FoldFunctionOnSetACAddIndex ==
  ASSUME NEW Typ, NEW op(_,_), NEW base \\in Typ,
         \\A t,u \\in Typ : op(t,u) \\in Typ,
         \\A t,u \\in Typ : op(t,u) = op(u,t),
         \\A t,u,v \\in Typ : op(t, op(u,v)) = op(op(t,u),v),
         NEW indices, IsFiniteSet(indices), NEW i, i \\notin indices,
         NEW fun, \\A j \\in indices \\union {i} : fun[j] \\in Typ
  PROVE FoldFunctionOnSet(op, base, fun, indices \\union {i}) =
        op(fun[i], FoldFunctionOnSet(op, base, fun, indices))

(*************************************************************************)
(* For an AC operator, folding an EXCEPT construction can be reduced to  *)
(* folding the original function.                                        *)
(*************************************************************************)
THEOREM FoldFunctionOnSetACExcept ==
  ASSUME NEW Typ, NEW op(_,_), NEW base \\in Typ,
         \\A t,u \\in Typ : op(t,u) \\in Typ,
         \\A t,u \\in Typ : op(t,u) = op(u,t),
         \\A t,u,v \\in Typ : op(t, op(u,v)) = op(op(t,u),v),
         NEW fun, NEW i, NEW y \\in Typ,
         NEW indices \\in SUBSET (DOMAIN fun), IsFiniteSet(indices), 
         \\A j \\in indices : fun[j] \\in Typ 
  PROVE  FoldFunctionOnSet(op, base, [fun EXCEPT ![i] = y], indices) =
         IF i \\in indices
         THEN op(y, FoldFunctionOnSet(op, base, fun, indices \\ {i}))
         ELSE FoldFunctionOnSet(op, base, fun, indices)

(*************************************************************************)
(* For an AC operator \`op\` for which \`base\` is the neutral element,      *)
(* folding a function commutes with set union, for disjoint sets.        *)
(*************************************************************************)
THEOREM FoldFunctionOnSetDisjointUnion ==
  ASSUME NEW Typ, NEW op(_,_), NEW base \\in Typ,
         \\A t,u \\in Typ : op(t,u) \\in Typ,
         \\A t,u \\in Typ : op(t,u) = op(u,t),
         \\A t,u,v \\in Typ : op(t, op(u,v)) = op(op(t,u),v),
         \\A t \\in Typ : op(base, t) = t,
         NEW S, IsFiniteSet(S), NEW T, IsFiniteSet(T), S \\cap T = {},
         NEW fun, \\A i \\in S \\union T : fun[i] \\in Typ
  PROVE FoldFunctionOnSet(op, base, fun, S \\union T) =
        op(FoldFunctionOnSet(op, base, fun, S), FoldFunctionOnSet(op, base, fun, T))

(*************************************************************************)
(* Analogous theorems for FoldFunction. Note that the theorems about     *)
(* adding an index and about disjoint union do not make sense here.      *)
(*************************************************************************)
THEOREM FoldFunctionEmpty ==
  ASSUME NEW op(_,_), NEW base, NEW fun, DOMAIN fun = {}
  PROVE  FoldFunction(op, base, fun) = base 

THEOREM FoldFunctionNonempty ==
  ASSUME NEW op(_,_), NEW base, NEW fun, 
         DOMAIN fun # {}, IsFiniteSet(DOMAIN fun)
  PROVE  \\E i \\in DOMAIN fun : FoldFunction(op, base, fun) = 
            op(fun[i], FoldFunctionOnSet(op, base, fun, DOMAIN fun \\ {i}))

THEOREM FoldFunctionType ==
  ASSUME NEW Typ, NEW op(_,_), NEW base \\in Typ,
         \\A t,u \\in Typ : op(t,u) \\in Typ,
         NEW fun, IsFiniteSet(DOMAIN fun),
         \\A i \\in DOMAIN fun : fun[i] \\in Typ
  PROVE FoldFunction(op, base, fun) \\in Typ

THEOREM FoldFunctionAC ==
  ASSUME NEW Typ, NEW op(_,_), NEW base \\in Typ,
         \\A t,u \\in Typ : op(t,u) \\in Typ,
         \\A t,u \\in Typ : op(t,u) = op(u,t),
         \\A t,u,v \\in Typ : op(t, op(u,v)) = op(op(t,u),v),
         NEW fun, IsFiniteSet(DOMAIN fun), NEW i \\in DOMAIN fun,
         \\A j \\in DOMAIN fun : fun[j] \\in Typ
  PROVE FoldFunction(op, base, fun) =
        op(fun[i], FoldFunctionOnSet(op, base, fun, (DOMAIN fun) \\ {i}))

THEOREM FoldFunctionACExcept ==
  ASSUME NEW Typ, NEW op(_,_), NEW base \\in Typ,
         \\A t,u \\in Typ : op(t,u) \\in Typ,
         \\A t,u \\in Typ : op(t,u) = op(u,t),
         \\A t,u,v \\in Typ : op(t, op(u,v)) = op(op(t,u),v),
         NEW fun, NEW i, NEW y \\in Typ,
         IsFiniteSet(DOMAIN fun), 
         \\A j \\in DOMAIN fun : fun[j] \\in Typ 
  PROVE  FoldFunction(op, base, [fun EXCEPT ![i] = y]) =
         IF i \\in DOMAIN fun
         THEN op(y, FoldFunctionOnSet(op, base, fun, (DOMAIN fun) \\ {i}))
         ELSE FoldFunction(op, base, fun)

(*************************************************************************)
(* Summing a function that returns natural numbers, resp. integers,      *)
(* yields a natural number, resp. an integer.                            *)
(*************************************************************************)
THEOREM SumFunctionOnSetNat ==
  ASSUME NEW fun, NEW indices, IsFiniteSet(indices),
         \\A i \\in indices : fun[i] \\in Nat 
  PROVE  SumFunctionOnSet(fun, indices) \\in Nat

THEOREM SumFunctionOnSetInt ==
  ASSUME NEW fun, NEW indices, IsFiniteSet(indices),
         \\A i \\in indices : fun[i] \\in Int
  PROVE  SumFunctionOnSet(fun, indices) \\in Int

(*************************************************************************)
(* Summing two functions that agree on all relevant indices yields the   *)
(* same result.                                                          *)
(*************************************************************************)
THEOREM SumFunctionOnSetEqual ==
  ASSUME NEW f, NEW g, NEW indices, IsFiniteSet(indices),
         \\A i \\in indices : f[i] = g[i]
  PROVE  SumFunctionOnSet(f, indices) = SumFunctionOnSet(g, indices)

(*************************************************************************)
(* Summing a function over the empty set is 0.                           *)
(*************************************************************************)
THEOREM SumFunctionOnSetEmpty ==
  ASSUME NEW fun 
  PROVE  SumFunctionOnSet(fun, {}) = 0

(*************************************************************************)
(* Summing a function over a non-empty set corresponds to the sum of     *)
(* element of the set and the sum of the function over the remainder.    *)
(*************************************************************************)
THEOREM SumFunctionOnSetNonempty ==
  ASSUME NEW fun, NEW indices, IsFiniteSet(indices), NEW i \\in indices,
         \\A j \\in indices : fun[j] \\in Int
  PROVE  SumFunctionOnSet(fun, indices) = 
         fun[i] + SumFunctionOnSet(fun, indices \\ {i})

\\* reformulation in terms of adding an index
THEOREM SumFunctionOnSetAddIndex ==
  ASSUME NEW fun, NEW indices, IsFiniteSet(indices), 
         NEW i, i \\notin indices,
         \\A j \\in indices \\union {i} : fun[j] \\in Int
  PROVE  SumFunctionOnSet(fun, indices \\union {i}) = 
         fun[i] + SumFunctionOnSet(fun, indices)

\\* corresponding lemma for removing an index
THEOREM SumFunctionOnSetRemoveIndex ==
  ASSUME NEW fun, NEW indices, IsFiniteSet(indices), NEW i \\in indices,
         \\A j \\in indices : fun[j] \\in Int
  PROVE  SumFunctionOnSet(fun, indices \\ {i}) = 
         SumFunctionOnSet(fun, indices) - fun[i]

(*************************************************************************)
(* Reduce the sum of an EXCEPT to the sum of the original function.      *)
(*************************************************************************)
THEOREM SumFunctionOnSetExcept ==
  ASSUME NEW fun, NEW i, NEW y \\in Int,
         NEW indices \\in SUBSET (DOMAIN fun), IsFiniteSet(indices),
         \\A j \\in indices : fun[j] \\in Int 
  PROVE  SumFunctionOnSet([fun EXCEPT ![i] = y], indices) =
         IF i \\in indices
         THEN SumFunctionOnSet(fun, indices) + y - fun[i]
         ELSE SumFunctionOnSet(fun, indices)

(*************************************************************************)
(* Summing a function distributes over disjoint union.                   *)
(*************************************************************************)
THEOREM SumFunctionOnSetDisjointUnion ==
  ASSUME NEW S, IsFiniteSet(S),
         NEW T, IsFiniteSet(T), S \\cap T = {},
         NEW fun, \\A x \\in S \\union T : fun[x] \\in Int 
  PROVE  SumFunctionOnSet(fun, S \\union T) =
         SumFunctionOnSet(fun, S) + SumFunctionOnSet(fun, T)

(*************************************************************************)
(* Summing a Nat-valued function is monotonic in the subset relation.    *)
(*************************************************************************)
THEOREM SumFunctionNatOnSubset ==
  ASSUME NEW S, IsFiniteSet(S), NEW T \\in SUBSET S,
         NEW fun, \\A s \\in S : fun[s] \\in Nat
  PROVE  SumFunctionOnSet(fun, T) <= SumFunctionOnSet(fun, S)

(*************************************************************************)
(* The sum of a Nat-valued function is zero iff all relevant function    *)
(* values are zero.                                                      *)
(*************************************************************************)
THEOREM SumFunctionOnSetZero ==
  ASSUME NEW S, IsFiniteSet(S),
         NEW fun, \\A x \\in S : fun[x] \\in Nat
  PROVE  SumFunctionOnSet(fun, S) = 0 <=> \\A x \\in S : fun[x] = 0

(*************************************************************************)
(* Given any Int-valued function f and finite set S such that f[s] = c   *)
(* for all s \\in S, summing f over S yields c multiplied by the          *)
(* cardinality of S. For example, for                                    *)
(*   f == [s \\in {"a", "b", "c"} |-> IF s = "c" THEN 42 ELSE 5],         *)
(*   SumFunctionOnSet(f, {"a","b"}) = 10.                                *)
(*************************************************************************)
THEOREM SumFunctionOnSetConst ==
  ASSUME NEW D, NEW S \\in SUBSET D, IsFiniteSet(S),
         NEW f \\in [D -> Int], NEW c \\in Int, \\A x \\in S : f[x] = c 
  PROVE  SumFunctionOnSet(f, S) = c * Cardinality(S)

(*************************************************************************)
(* Summing a function is monotonic in the function argument.             *)
(*************************************************************************)
THEOREM SumFunctionOnSetMonotonic ==
  ASSUME NEW S, IsFiniteSet(S),
         NEW f, \\A s \\in S : f[s] \\in Int,
         NEW g, \\A s \\in S : g[s] \\in Int,
         \\A s \\in S : f[s] <= g[s]
  PROVE  SumFunctionOnSet(f, S) <= SumFunctionOnSet(g, S)

(*************************************************************************)
(* The sum over function f is strictly smaller than the sum over g if    *)
(* f[x] <= g[x] for all x \\in S and f[x] < g[s] holds for at least some  *)
(* element s \\in S.                                                      *)
(*************************************************************************)
THEOREM SumFunctionOnSetStrictlyMonotonic ==
  ASSUME NEW S, IsFiniteSet(S),
         NEW f, \\A s \\in S : f[s] \\in Int,
         NEW g, \\A s \\in S : g[s] \\in Int,
         \\A x \\in S : f[x] <= g[x],
         NEW s \\in S, f[s] < g[s]
  PROVE  SumFunctionOnSet(f, S) < SumFunctionOnSet(g, S)

(*************************************************************************)
(* Similar theorems for SumFunction.                                     *)
(*************************************************************************)
THEOREM SumFunctionNat ==
  ASSUME NEW fun, IsFiniteSet(DOMAIN fun),
         \\A x \\in DOMAIN fun : fun[x] \\in Nat 
  PROVE  SumFunction(fun) \\in Nat

THEOREM SumFunctionInt ==
  ASSUME NEW fun, IsFiniteSet(DOMAIN fun),
         \\A x \\in DOMAIN fun : fun[x] \\in Int 
  PROVE  SumFunction(fun) \\in Int 

THEOREM SumFunctionEmpty ==
  ASSUME NEW fun, DOMAIN fun = {}
  PROVE  SumFunction(fun) = 0

THEOREM SumFunctionNonempty ==
  ASSUME NEW fun, IsFiniteSet(DOMAIN fun), NEW x \\in DOMAIN fun,
         \\A i \\in DOMAIN fun : fun[i] \\in Int
  PROVE  SumFunction(fun) = fun[x] + SumFunctionOnSet(fun, (DOMAIN fun) \\ {x})

THEOREM SumFunctionExcept ==
  ASSUME NEW fun, NEW i, NEW y \\in Int, IsFiniteSet(DOMAIN fun),
         \\A x \\in DOMAIN fun : fun[x] \\in Int 
  PROVE  SumFunction([fun EXCEPT ![i] = y]) =
         IF i \\in DOMAIN fun 
         THEN SumFunction(fun) + y - fun[i]
         ELSE SumFunction(fun)

THEOREM SumFunctionZero ==
  ASSUME NEW fun, IsFiniteSet(DOMAIN fun), 
         \\A x \\in DOMAIN fun : fun[x] \\in Nat
  PROVE  SumFunction(fun) = 0 <=> \\A x \\in DOMAIN fun : fun[x] = 0

(*************************************************************************)
(* Summing a constant function yields the constant multiplied by the     *)
(* cardinality of its domain. For example,                               *)
(*   SumFunction([s \\in {"a","b","c"} |-> 5]) = 15.                      *)
(*************************************************************************)
THEOREM SumFunctionConst ==
  ASSUME NEW S, IsFiniteSet(S), NEW c \\in Int
  PROVE  SumFunction([s \\in S |-> c]) = c * Cardinality(S)

THEOREM SumFunctionMonotonic ==
  ASSUME NEW f, IsFiniteSet(DOMAIN f), NEW g, DOMAIN g = DOMAIN f,
         \\A x \\in DOMAIN f : f[x] \\in Int,
         \\A x \\in DOMAIN f : g[x] \\in Int,
         \\A x \\in DOMAIN f : f[x] <= g[x]
  PROVE  SumFunction(f) <= SumFunction(g)

THEOREM SumFunctionStrictlyMonotonic ==
  ASSUME NEW f, IsFiniteSet(DOMAIN f), NEW g, DOMAIN g = DOMAIN f,
         \\A x \\in DOMAIN f : f[x] \\in Int,
         \\A x \\in DOMAIN f : g[x] \\in Int,
         \\A x \\in DOMAIN f : f[x] <= g[x],
         NEW s \\in DOMAIN f, f[s] < g[s]
  PROVE  SumFunction(f) < SumFunction(g)

=============================================================================
\\* Created Thu Apr 11 10:36:10 PDT 2013 by tomr
`,
  ],
  [
    "NaturalsInduction",
    `------------------------- MODULE NaturalsInduction --------------------------
(***************************************************************************)
(* This module contains useful theorems for inductive proofs and recursive *)
(* definitions over the naturals.                                          *)
(*                                                                         *)
(* Some of the statements of the theorems are decomposed in terms of       *)
(* definitions.  This is done for two reasons:                             *)
(*                                                                         *)
(*  - It makes it easier for the backends to instantiate the theorems      *)
(*    when those definitions are not expanded.                             *)
(*                                                                         *)
(*  - It can be convenient when writing proofs to use those definitions    *)
(*    rather than having to write out their expansions.                    *)
(***************************************************************************)
EXTENDS Integers

(***************************************************************************)
(* The following is the simple statement of inductions over the naturals.  *)
(* For predicates P defined by a moderately complex operator, it is often  *)
(* useful to hide the operator definition before using this theorem. That  *)
(* is, you first define a suitable operator P (not necessarily by that     *)
(* name), prove the two hypotheses of the theorem, and then hide the       *)
(* definition of P when using the theorem.                                 *)
(***************************************************************************)
THEOREM NatInduction ==
  ASSUME NEW P(_),
         P(0),
         \\A n \\in Nat : P(n) => P(n+1)
  PROVE  \\A n \\in Nat : P(n)

(***************************************************************************)
(* A useful corollary of NatInduction                                      *)
(***************************************************************************)
THEOREM DownwardNatInduction ==
  ASSUME NEW P(_), NEW m \\in Nat, P(m),
         \\A n \\in 1 .. m : P(n) => P(n-1)
  PROVE  P(0)

(***************************************************************************)
(* The following theorem expresses a stronger induction principle,         *)
(* also known as course-of-values induction, where the induction           *)
(* hypothesis is available for all strictly smaller natural numbers.       *)
(***************************************************************************)
THEOREM GeneralNatInduction ==
          ASSUME NEW P(_),
                 \\A n \\in Nat : (\\A m \\in 0..(n-1) : P(m)) => P(n)
          PROVE  \\A n \\in Nat : P(n)

(***************************************************************************)
(* The following theorem expresses the \`\`least-number principle'':         *)
(* if P(n) is true for some natural number n then there is a               *)
(* smallest natural number for which P is true. It could be derived in     *)
(* module WellFoundedInduction as a corollary of the fact that the natural *)
(* numbers are well ordered, but we give a direct proof.                   *)
(***************************************************************************)
THEOREM SmallestNatural ==
  ASSUME NEW P(_), NEW n \\in Nat, P(n)
  PROVE  \\E m \\in Nat : /\\ P(m)
                        /\\ \\A k \\in 0 .. m-1 : ~ P(k)

(***************************************************************************)
(* The following theorem says that a recursively defined function f over   *)
(* the natural numbers is well-defined if for every n \\in Nat the          *)
(* definition of f[n] depends only on arguments smaller than n.            *)
(***************************************************************************)
THEOREM RecursiveFcnOfNat ==
  ASSUME NEW Def(_,_),
         ASSUME NEW n \\in Nat, NEW g, NEW h,
                \\A i \\in 0..(n-1) : g[i] = h[i]
         PROVE  Def(g, n) = Def(h, n)
  PROVE  LET f[n \\in Nat] == Def(f, n)
         IN  f = [n \\in Nat |-> Def(f, n)]

(***************************************************************************)
(* The following theorem NatInductiveDef is what you use to justify a      *)
(* function defined by primitive recursion over the naturals.              *)
(***************************************************************************)
NatInductiveDefHypothesis(f, f0, Def(_,_)) ==
   (f =  CHOOSE g : g = [i \\in Nat |-> IF i = 0 THEN f0 ELSE Def(g[i-1], i)])
NatInductiveDefConclusion(f, f0, Def(_,_)) ==
     f = [i \\in Nat |-> IF i = 0 THEN f0 ELSE Def(f[i-1], i)]

THEOREM NatInductiveDef ==
  ASSUME NEW Def(_,_), NEW f, NEW f0,
         NatInductiveDefHypothesis(f, f0, Def)
  PROVE  NatInductiveDefConclusion(f, f0, Def)

(***************************************************************************)
(* The following two theorems allow you to prove the type of a recursively *)
(* defined function over the natural numbers.                              *)
(***************************************************************************)
THEOREM RecursiveFcnOfNatType ==
  ASSUME NEW f, NEW S, NEW Def(_,_), f = [n \\in Nat |-> Def(f,n)],
         ASSUME NEW n \\in Nat, NEW g, \\A i \\in 0 .. n-1 : g[i] \\in S
         PROVE  Def(g,n) \\in S
  PROVE  f \\in [Nat -> S]

THEOREM NatInductiveDefType ==
  ASSUME NEW Def(_,_), NEW S, NEW f, NEW f0 \\in S,
         NatInductiveDefConclusion(f, f0, Def),
         f0 \\in S,
         \\A v \\in S, n \\in Nat \\ {0} : Def(v, n) \\in S
  PROVE  f \\in [Nat -> S]

(***************************************************************************)
(* The following theorems show uniqueness of functions recursively defined *)
(* over Nat.                                                               *)
(***************************************************************************)
THEOREM RecursiveFcnOfNatUnique ==
  ASSUME NEW Def(_,_), NEW f, NEW g,
         f = [n \\in Nat |-> Def(f,n)],
         g = [n \\in Nat |-> Def(g,n)],
         ASSUME NEW n \\in Nat, NEW ff, NEW gg,
                \\A i \\in 0..(n-1) : ff[i] = gg[i]
         PROVE  Def(ff, n) = Def(gg, n)
  PROVE  f = g

THEOREM NatInductiveUnique ==
  ASSUME NEW Def(_,_), NEW f, NEW g, NEW f0,
         NatInductiveDefConclusion(f, f0, Def),
         NatInductiveDefConclusion(g, f0, Def)
  PROVE  f = g

(***************************************************************************)
(* The following theorems are analogous to the preceding ones but for      *)
(* functions defined over intervals of natural numbers.                    *)
(***************************************************************************)

FiniteNatInductiveDefHypothesis(f, c, Def(_,_), m, n) ==
   (f =  CHOOSE g : g = [i \\in m..n |-> IF i = m THEN c ELSE Def(g[i-1], i)])
FiniteNatInductiveDefConclusion(f, c, Def(_,_), m, n) ==
     f = [i \\in m..n |-> IF i = m THEN c ELSE Def(f[i-1], i)]

THEOREM FiniteNatInductiveDef ==
  ASSUME NEW Def(_,_), NEW f, NEW c, NEW m \\in Nat, NEW n \\in Nat,
         FiniteNatInductiveDefHypothesis(f, c, Def, m, n)
  PROVE  FiniteNatInductiveDefConclusion(f, c, Def, m, n)

THEOREM FiniteNatInductiveDefType ==
  ASSUME NEW S, NEW Def(_,_), NEW f, NEW c \\in S, NEW m \\in Nat, NEW n \\in Nat,
         FiniteNatInductiveDefConclusion(f, c, Def, m, n),
         \\A v \\in S, i \\in (m+1) .. n : Def(v,i) \\in S
  PROVE  f \\in [m..n -> S]

THEOREM FiniteNatInductiveUnique ==
  ASSUME NEW Def(_,_), NEW f, NEW g, NEW c, NEW m \\in Nat, NEW n \\in Nat,
         FiniteNatInductiveDefConclusion(f, c, Def, m, n),
         FiniteNatInductiveDefConclusion(g, c, Def, m, n)
  PROVE  f = g

=============================================================================

(***************************************************************************)
(* The following example shows how this module is used.                    *)
(***************************************************************************)

factorial[n \\in Nat] == IF n = 0 THEN 1 ELSE n * factorial[n-1]

THEOREM FactorialDefConclusion == NatInductiveDefConclusion(factorial, 1, LAMBDA v,n : n*v)
<1>1. NatInductiveDefHypothesis(factorial, 1, LAMBDA v,n : n*v)
  BY DEF NatInductiveDefHypothesis, factorial
<1>2. QED
  BY <1>1, NatInductiveDef

THEOREM FactorialDef == \\A n \\in Nat : factorial[n] = IF n = 0 THEN 1 ELSE n * factorial[n-1]
BY FactorialDefConclusion DEF NatInductiveDefConclusion

THEOREM FactorialType == factorial \\in [Nat -> Nat]
<1>1. \\A v \\in Nat, n \\in Nat \\ {0} : n * v \\in Nat
  OBVIOUS
<1>2. QED
  BY <1>1, NatInductiveDefType, FactorialDefConclusion, Isa


\\* Modification History
\\* Last modified Thu Aug 22 15:29:20 CEST 2019 by merz
\\* Last modified Tue Oct 15 12:06:48 CEST 2013 by shaolin
\\* Last modified Sat Nov 26 08:49:59 CET 2011 by merz
\\* Last modified Mon Nov 07 08:58:05 PST 2011 by lamport
\\* Created Mon Oct 31 02:52:05 PDT 2011 by lamport
`,
  ],
  [
    "RealTime",
    `----------------------------- MODULE RealTime -------------------------------
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
=============================================================================
`,
  ],
  [
    "SequenceTheorems",
    `-------------------------- MODULE SequenceTheorems --------------------------
(***************************************************************************)
(* This module contains theorems about operations on sequences.            *)
(***************************************************************************)
EXTENDS Sequences, Functions
LOCAL INSTANCE NaturalsInduction
LOCAL INSTANCE TLAPS


(***************************************************************************)
(* Elementary properties about Seq(S)                                      *)
(***************************************************************************)

LEMMA SeqDef == \\A S : Seq(S) = UNION {[1..n -> S] : n \\in Nat}

THEOREM SeqMonotonic ==
  ASSUME NEW S, NEW T, NEW seq \\in Seq(S),
         S \\subseteq T
  PROVE  seq \\in Seq(T)

THEOREM ElementOfSeq ==
   ASSUME NEW S, NEW seq \\in Seq(S),
          NEW n \\in 1..Len(seq)
   PROVE  seq[n] \\in S

THEOREM EmptySeq ==
   ASSUME NEW S
   PROVE /\\ << >> \\in Seq(S)
         /\\ Len(<< >>) = 0
         /\\ \\A seq \\in Seq(S) : (seq # << >>) => (Len(seq) \\in Nat \\ {0})

THEOREM LenProperties ==
  ASSUME NEW S, NEW seq \\in Seq(S)
  PROVE  /\\ Len(seq) \\in Nat
         /\\ seq \\in [1..Len(seq) -> S]
         /\\ DOMAIN seq = 1 .. Len(seq)

THEOREM IsASeq ==
  ASSUME NEW n \\in Nat, NEW e(_), NEW S,
         \\A i \\in 1..n : e(i) \\in S
  PROVE  [i \\in 1..n |-> e(i)] \\in Seq(S)

THEOREM ExceptSeq ==
  ASSUME NEW S, NEW seq \\in Seq(S), NEW i \\in 1 .. Len(seq), NEW e \\in S
  PROVE  /\\ [seq EXCEPT ![i] = e] \\in Seq(S)
         /\\ Len([seq EXCEPT ![i] = e]) = Len(seq)
         /\\ \\A j \\in 1 .. Len(seq) : [seq EXCEPT ![i] = e][j] = IF j=i THEN e ELSE seq[j]

THEOREM SeqEqual ==
  ASSUME NEW S, NEW s \\in Seq(S), NEW t \\in Seq(S),
         Len(s) = Len(t), \\A i \\in 1 .. Len(s) : s[i] = t[i]
  PROVE  s = t

(**************************************************************************)
(* Properties of concatenation (\\o)                                       *)
(**************************************************************************)

THEOREM ConcatProperties ==
  ASSUME NEW S, NEW s1 \\in Seq(S), NEW s2 \\in Seq(S)
  PROVE  /\\ s1 \\o s2 \\in Seq(S)
         /\\ Len(s1 \\o s2) = Len(s1) + Len(s2)
         /\\ \\A i \\in 1 .. Len(s1) + Len(s2) : (s1 \\o s2)[i] =
                     IF i <= Len(s1) THEN s1[i] ELSE s2[i - Len(s1)]

THEOREM ConcatEmptySeq ==
  ASSUME NEW S, NEW seq \\in Seq(S)
  PROVE  /\\ seq \\o << >> = seq
         /\\ << >> \\o seq = seq

THEOREM ConcatEqualIffEmpty ==
  ASSUME NEW S, NEW s \\in Seq(S), NEW t \\in Seq(S)
  PROVE  /\\ s \\o t = s <=> t = << >>
         /\\ s \\o t = t <=> s = << >>
         /\\ s \\o t = << >> <=> s = << >> /\\ t = << >>

THEOREM ConcatAssociative ==
  ASSUME NEW S, NEW s \\in Seq(S), NEW t \\in Seq(S), NEW u \\in Seq(S)
  PROVE  (s \\o t) \\o u = s \\o (t \\o u)

(****************************************************************************)
(* Intentionally not written as an ASSUME ... PROVE such that the conjuncts *)
(* can be named individually.                                               *)
(****************************************************************************)
THEOREM ConcatSimplifications ==
  /\\ idRight:: \\A S : \\A s,t \\in Seq(S) : s \\o t = s => t = <<>>
  /\\ idLeft:: \\A S : \\A s,t \\in Seq(S) : s \\o t = t => s = <<>>
  /\\ concIsEmpty:: \\A S : \\A s,t \\in Seq(S) : s \\o t = <<>> => s = <<>> /\\ t = <<>>
  /\\ cancelLeft:: \\A S : \\A s,t,v \\in Seq(S) : s \\o t = s \\o v => t = v
  /\\ cancelRight:: \\A S : \\A s,t,v \\in Seq(S) : s \\o v = t \\o v => s = t

(***************************************************************************)
(*                     SubSeq, Head and Tail                               *)
(***************************************************************************)

THEOREM SubSeqProperties ==
  ASSUME NEW S, NEW s, NEW m \\in Int, NEW n \\in Int,
         \\A i \\in m .. n : s[i] \\in S
   PROVE /\\ SubSeq(s,m,n) \\in Seq(S)
         /\\ Len(SubSeq(s,m,n)) = IF m<=n THEN n-m+1 ELSE 0
         /\\ \\A i \\in 1 .. n-m+1 : SubSeq(s,m,n)[i] = s[m+i-1]

THEOREM SubSeqEmpty ==
  ASSUME NEW s, NEW m \\in Int, NEW n \\in Int, n < m
  PROVE  SubSeq(s,m,n) = << >>

THEOREM SubSeqRange ==
  ASSUME NEW S, NEW s \\in Seq(S), NEW m \\in 1 .. Len(s), NEW n \\in 1 .. Len(s)
  PROVE  Range(SubSeq(s,m,n)) \\subseteq Range(s)

THEOREM HeadTailProperties ==
   ASSUME NEW S,
          NEW s \\in Seq(S), s # << >>
   PROVE  /\\ Head(s) \\in S
          /\\ Head(s) \\in Range(s)
          /\\ Tail(s) \\in Seq(S)
          /\\ Len(Tail(s)) = Len(s)-1
          /\\ \\A i \\in 1 .. Len(Tail(s)) : Tail(s)[i] = s[i+1]
          /\\ Range(Tail(s)) \\subseteq Range(s)

THEOREM TailIsSubSeq ==
  ASSUME NEW S,
         NEW s \\in Seq(S), s # << >>
  PROVE  Tail(s) = SubSeq(s, 2, Len(s))

THEOREM SubSeqRestrict ==
  ASSUME NEW S, NEW seq \\in Seq(S), NEW n \\in 0 .. Len(seq)
  PROVE  SubSeq(seq, 1, n) = Restrict(seq, 1 .. n)

THEOREM HeadTailOfSubSeq ==
  ASSUME NEW S, NEW seq \\in Seq(S),
         NEW m \\in 1 .. Len(seq), NEW n \\in m .. Len(seq)
  PROVE  /\\ Head(SubSeq(seq,m,n)) = seq[m]
         /\\ Tail(SubSeq(seq,m,n)) = SubSeq(seq, m+1, n)

THEOREM SubSeqRecursive ==
  ASSUME NEW S, NEW seq \\in Seq(S),
         NEW m \\in 1 .. Len(seq), NEW n \\in m .. Len(seq)
  PROVE  /\\ SubSeq(seq, m, n) = << seq[m] >> \\o SubSeq(seq, m+1, n)
         /\\ SubSeq(seq, m, n) = SubSeq(seq, m, n-1) \\o << seq[n] >>

(***************************************************************************)
(* Subsequences of subsequences.                                           *)
(***************************************************************************)
THEOREM SubSeqOfSubSeq ==
  ASSUME NEW S, NEW s \\in Seq(S), NEW t \\in Seq(S),
         NEW i \\in 1 .. Len(s), NEW j \\in 1 .. Len(s),
         NEW m \\in 1 .. j-i+1, NEW n \\in 1 .. j-i+1
  PROVE  SubSeq(SubSeq(s,i,j),m,n) = SubSeq(s, i+m-1, i+n-1)

(*****************************************************************************)
(* Adjacent subsequences can be concatenated to obtain a longer subsequence. *)
(*****************************************************************************)
THEOREM ConcatAdjacentSubSeq ==
  ASSUME NEW S, NEW seq \\in Seq(S),
         NEW m \\in 1 .. Len(seq)+1,
         NEW k \\in m-1 .. Len(seq),
         NEW n \\in k .. Len(seq)
  PROVE  SubSeq(seq, m, k) \\o SubSeq(seq, k+1, n) = SubSeq(seq, m, n)

(***************************************************************************)
(* Special cases of subsequences of concatenations.                        *)
(***************************************************************************)
THEOREM SubSeqOfConcat1 ==
  ASSUME NEW S, NEW s \\in Seq(S), NEW t \\in Seq(S),
         NEW m \\in 1 .. Len(s), NEW n \\in 1 .. Len(s)
  PROVE  SubSeq(s \\o t, m, n) = SubSeq(s, m, n)

THEOREM SubSeqOfConcat2 ==
  ASSUME NEW S, NEW s \\in Seq(S), NEW t \\in Seq(S),
         NEW m \\in Len(s)+1 .. Len(s)+Len(t), NEW n \\in Len(s)+1 .. Len(s)+Len(t)
  PROVE  SubSeq(s \\o t, m, n) = SubSeq(t, m - Len(s), n - Len(s))

(***************************************************************************)
(* Theorems about Append                                                   *)
(***************************************************************************)

THEOREM AppendProperties ==
  ASSUME NEW S, NEW seq \\in Seq(S), NEW elt \\in S
  PROVE  /\\ Append(seq, elt) \\in Seq(S)
         /\\ Append(seq, elt) # << >>
         /\\ Len(Append(seq, elt)) = Len(seq)+1
         /\\ \\A i \\in 1.. Len(seq) : Append(seq, elt)[i] = seq[i]
         /\\ Append(seq, elt)[Len(seq)+1] = elt
         /\\ Range(Append(seq, elt)) = Range(seq) \\cup {elt}

THEOREM AppendIsConcat ==
  ASSUME NEW S, NEW seq \\in Seq(S), NEW elt \\in S
  PROVE  Append(seq, elt) = seq \\o <<elt>>

THEOREM HeadTailAppend ==
  ASSUME NEW S, NEW seq \\in Seq(S), NEW elt
  PROVE  /\\ Head(Append(seq, elt)) = IF seq = <<>> THEN elt ELSE Head(seq)
         /\\ Tail(Append(seq, elt)) = IF seq = <<>> THEN <<>> ELSE Append(Tail(seq), elt)

THEOREM AppendInjective ==
  ASSUME NEW S, NEW e \\in S, NEW s \\in Seq(S), NEW f \\in S, NEW t \\in Seq(S)
  PROVE  Append(s,e) = Append(t,f) <=> s = t /\\ e = f

THEOREM SequenceEmptyOrAppend ==
  ASSUME NEW S, NEW seq \\in Seq(S), seq # << >>
  PROVE \\E s \\in Seq(S), elt \\in S : seq = Append(s, elt)

(***************************************************************************)
(* Inductive reasoning for sequences                                       *)
(***************************************************************************)

THEOREM SequencesInductionAppend ==
  ASSUME NEW P(_), NEW S,
         P(<< >>),
         \\A s \\in Seq(S), e \\in S : P(s) => P(Append(s,e))
  PROVE  \\A seq \\in Seq(S) : P(seq)

THEOREM SequencesInductionTail ==
  ASSUME NEW S,  NEW P(_),
         P(<< >>),
         \\A s \\in Seq(S) : (s # << >>) /\\ P(Tail(s)) => P(s)
  PROVE  \\A s \\in Seq(S) : P(s)


(***************************************************************************)
(*                          RANGE OF SEQUENCE                              *)
(***************************************************************************)

THEOREM RangeOfSeq ==
  ASSUME NEW S, NEW seq \\in Seq(S)
  PROVE  Range(seq) \\in SUBSET S

THEOREM RangeEquality ==
  ASSUME NEW S, NEW seq \\in Seq(S)
  PROVE Range(seq) = { seq[i] : i \\in 1 .. Len(seq) }

THEOREM SeqOfRange ==
  ASSUME NEW S, NEW seq \\in Seq(S)
  PROVE  seq \\in Seq(Range(seq))

(* The range of the concatenation of two sequences is the union of the ranges *)
THEOREM RangeConcatenation ==
  ASSUME NEW S, NEW s1 \\in Seq(S), NEW s2 \\in Seq(S)
  PROVE  Range(s1 \\o s2) = Range(s1) \\cup Range(s2)

(***************************************************************************)
(* Theorems about injective sequences, i.e. sequences without duplicates.  *)
(***************************************************************************)

LEMMA EmptySingletonIsInjective ==
  /\\ IsInjective(<< >>)
  /\\ \\A e : IsInjective(<< e >>)

LEMMA ConcatInjectiveSeq ==
  ASSUME NEW S, NEW s \\in Seq(S), NEW t \\in Seq(S)
  PROVE  IsInjective(s \\o t) <=>
         IsInjective(s) /\\ IsInjective(t) /\\ Range(s) \\cap Range(t) = {}

LEMMA AppendInjectiveSeq ==
  ASSUME NEW S, NEW seq \\in Seq(S), NEW e \\in S
  PROVE  IsInjective(Append(seq,e)) <=> IsInjective(seq) /\\ e \\notin Range(seq)

LEMMA TailInjectiveSeq ==
  ASSUME NEW S, NEW seq \\in Seq(S), IsInjective(seq), seq # << >>
  PROVE  /\\ IsInjective(Tail(seq))
         /\\ Range(Tail(seq)) = Range(seq) \\ {Head(seq)}

=============================================================================
`,
  ],
  [
    "WellFoundedInduction",
    `------------------------ MODULE WellFoundedInduction ------------------------
(***************************************************************************)
(* This module contains useful theorems for inductive proofs and recursive *)
(* definitions based on a well-founded ordering.                           *)
(*                                                                         *)
(* Most of the statements of the theorems are decomposed in terms of       *)
(* definitions.  This is done for two reasons:                             *)
(*                                                                         *)
(*  - It makes it easier for the backends to instantiate the theorems      *)
(*    when those definitions are not expanded.  In fact, at the moment     *)
(*    the provers can't prove any of those theorems from the theorem       *)
(*    itself if the definitions are made usable.                           *)
(*                                                                         *)
(*  - It can be convenient when writing proofs to use those definitions    *)
(*    rather than having to write out their expansions.                    *)
(*                                                                         *)
(* A relation is represented as a set of ordered pairs, where we write     *)
(* <<x, y>> \\in R instead of x R y.  It is more convenient to represent    *)
(* relations this way rather than as operators such as < .                 *)
(***************************************************************************)
EXTENDS NaturalsInduction

(***************************************************************************)
(* The following defines what it means for a relation R to be transitively *)
(* closed on a set S.  In this and other definitions, we think of R as a   *)
(* relation on S, meaning that it is a subset of S \\X S.  However, this is *)
(* not necessary.  Our results do not require this as a hypothesis, and it *)
(* is often convenient to apply them when R is a relation on a set         *)
(* containing S as a subset.  They're even true (though uninteresting) if  *)
(* R and S \\X S are disjoint sets.                                         *)
(***************************************************************************)
IsTransitivelyClosedOn(R, S) ==
   \\A i, j, k \\in S : (<<i, j>> \\in R)  /\\ (<<j, k>> \\in  R)
                         => (<<i, k>> \\in R)
(***************************************************************************)
(* If we think of R as a less-than relation, then R is well founded on S   *)
(* iff there is no "infinitely descending" sequence of elements of S.  The *)
(* canonical example of a well founded relation is the ordinary less-than  *)
(* relation on the natural numbers.                                        *)
(*                                                                         *)
(* A S with a well-founded ordering is often called well-ordered.          *)
(***************************************************************************)
IsWellFoundedOn(R, S) ==
    ~ \\E f \\in [Nat -> S] : \\A n \\in Nat : <<f[n+1], f[n]>> \\in R

LEMMA EmptyIsWellFounded == \\A S : IsWellFoundedOn({}, S)


LEMMA IsWellFoundedOnSubset ==
        ASSUME NEW R, NEW S, NEW T \\in SUBSET S,
               IsWellFoundedOn(R,S)
        PROVE  IsWellFoundedOn(R,T)


LEMMA IsWellFoundedOnSubrelation ==
       ASSUME NEW S, NEW R, NEW RR, RR \\cap (S \\X S) \\subseteq R,
              IsWellFoundedOn(R,S)
       PROVE  IsWellFoundedOn(RR,S)

(***************************************************************************)
(* If we think of R as a less-than relation on S, then the following is    *)
(* the set of elements of S that are less than x.                          *)
(***************************************************************************)
SetLessThan(x, R, S) ==  {y \\in S : <<y, x>> \\in R}

(***************************************************************************)
(* If we think of R as a less-than relation on S, then R is well-founded   *)
(* iff every non-empty subset of S has a minimal element.                  *)
(***************************************************************************)

THEOREM WFMin ==
         ASSUME NEW R, NEW S,
                IsWellFoundedOn(R, S),
                NEW T, T \\subseteq S, T # {}
         PROVE  \\E x \\in T : \\A y \\in T : ~ (<<y, x>> \\in R)


THEOREM MinWF ==
         ASSUME NEW R, NEW S,
                \\A T \\in SUBSET S : T # {} => \\E x \\in T : \\A y \\in T : ~ (<<y, x>> \\in R)
         PROVE  IsWellFoundedOn(R,S)

(***************************************************************************)
(* The two following lemmas are simple consequences of theorem WFMin.      *)
(***************************************************************************)
LEMMA WellFoundedIsIrreflexive ==
        ASSUME NEW R, NEW S, NEW x \\in S,
               IsWellFoundedOn(R, S)
        PROVE  <<x, x>> \\notin R

LEMMA WellFoundedIsAsymmetric ==
        ASSUME NEW R, NEW S, NEW x \\in S, NEW y \\in S,
               IsWellFoundedOn(R,S),
               <<x,y>> \\in R, <<y,x>> \\in R
        PROVE  FALSE

(***************************************************************************)
(* The following lemmas are simple facts about operator SetLessThan.       *)
(***************************************************************************)
LEMMA WFSetLessThanIrreflexive ==
        ASSUME NEW R, NEW S, NEW x \\in S,
               IsWellFoundedOn(R,S)
        PROVE  x \\notin SetLessThan(x,R,S)

LEMMA SetLessTransitive ==
        ASSUME NEW R, NEW S, NEW x \\in S, NEW y \\in SetLessThan(x,R,S),
               IsTransitivelyClosedOn(R, S)
        PROVE  SetLessThan(y, R, S) \\subseteq SetLessThan(x, R, S)

----------------------------------------------------------------------------
(***************************************************************************)
(* The following theorem is the basis for proof by induction over a        *)
(* well-founded set.  It generalizes theorem GeneralNatInduction of module *)
(* NaturalsInduction.                                                      *)
(***************************************************************************)
THEOREM WFInduction ==
          ASSUME NEW P(_), NEW R, NEW S,
                 IsWellFoundedOn(R, S),
                 \\A x \\in S : (\\A y \\in SetLessThan(x, R, S) : P(y))
                    => P(x)
          PROVE  \\A x \\in S : P(x)

(***************************************************************************)
(* Theorem WFInductiveDef below justifies recursive definitions based on a *)
(* well-founded ordering.  We first prove it with the hypothesis that the  *)
(* ordering is transitively closed.  We prove the theorem for an arbitrary *)
(* well-founded relation by applying the special case to its transitive    *)
(* closure.                                                                *)
(***************************************************************************)
WFDefOn(R, S, Def(_,_)) ==
   \\A g, h :
      \\A x \\in S :
         (\\A y \\in SetLessThan(x, R, S) : g[y] = h[y])
           => (Def(g,x) = Def(h,x))

OpDefinesFcn(f, S, Def(_,_)) ==
   f =  CHOOSE g : g = [x \\in S |-> Def(g, x)]

WFInductiveDefines(f, S, Def(_,_)) ==
     f = [x \\in S |-> Def(f, x)]

WFInductiveUnique(S, Def(_,_)) ==
  \\A g, h : /\\ WFInductiveDefines(g, S, Def)
            /\\ WFInductiveDefines(h, S, Def)
            => (g = h)

THEOREM WFDefOnUnique ==
          ASSUME NEW Def(_,_), NEW R, NEW S,
                 IsWellFoundedOn(R, S), WFDefOn(R, S, Def)
          PROVE  WFInductiveUnique(S, Def)

LEMMA WFInductiveDefLemma ==
        ASSUME NEW Def(_,_), NEW R, NEW S, NEW f,
               IsWellFoundedOn(R, S),
               IsTransitivelyClosedOn(R, S),
               WFDefOn(R, S, Def),
               OpDefinesFcn(f, S, Def)
        PROVE  WFInductiveDefines(f, S, Def)

(***************************************************************************)
(* The following defines the transitive closure of the relation R on S.    *)
(* More precisely, it is the transitive closure of the restriction of R    *)
(* to S.  We give an abstract definition of transitive closure as the      *)
(* smallest relation that contains R (restricted to S \\X S) and that is    *)
(* transitively closed, then prove some relevant properties.               *)
(***************************************************************************)
TransitiveClosureOn(R,S) ==
   { ss \\in S \\X S :
        \\A U \\in SUBSET (S \\X S) :
           /\\ R \\cap S \\X S \\subseteq U
           /\\ IsTransitivelyClosedOn(U, S)
           => ss \\in U }

LEMMA TransitiveClosureThm ==
         \\A R, S :
           /\\ R \\cap S \\X S \\subseteq TransitiveClosureOn(R, S)
           /\\ IsTransitivelyClosedOn(TransitiveClosureOn(R, S), S)

LEMMA TransitiveClosureMinimal ==
        ASSUME NEW R, NEW S, NEW U \\in SUBSET (S \\X S),
               R \\cap S \\X S \\subseteq U,
               IsTransitivelyClosedOn(U,S)
        PROVE  TransitiveClosureOn(R,S) \\subseteq U

(***************************************************************************)
(* The following lemmas are consequences of the two previous ones. The     *)
(* first three state closure properties of transitive closure, the fourth  *)
(* lemma allows one to chop off a step in the underlying relation for any  *)
(* pair in the transitive closure.                                         *)
(***************************************************************************)

LEMMA TCTCTC ==
       ASSUME NEW R, NEW S, NEW i \\in S, NEW j \\in S, NEW k \\in S,
              <<i,j>> \\in TransitiveClosureOn(R,S),
              <<j,k>> \\in TransitiveClosureOn(R,S)
       PROVE  <<i,k>> \\in TransitiveClosureOn(R,S)

LEMMA TCRTC ==
       ASSUME NEW R, NEW S, NEW i \\in S, NEW j \\in S, NEW k \\in S,
              <<i,j>> \\in TransitiveClosureOn(R,S), <<j,k>> \\in R
       PROVE  <<i,k>> \\in TransitiveClosureOn(R,S)

LEMMA RTCTC ==
       ASSUME NEW R, NEW S, NEW i \\in S, NEW j \\in S, NEW k \\in S,
              <<i,j>> \\in R, <<j,k>> \\in TransitiveClosureOn(R,S)
       PROVE  <<i,k>> \\in TransitiveClosureOn(R,S)

LEMMA TransitiveClosureChopLast ==
        ASSUME NEW R, NEW S, NEW i \\in S, NEW k \\in S, <<i,k>> \\in TransitiveClosureOn(R,S)
        PROVE  \\E j \\in S : /\\ <<j,k>> \\in R
                            /\\ i = j \\/ <<i,j>> \\in TransitiveClosureOn(R,S)

(***************************************************************************)
(* NB: In a similar way to the preceding lemma, one could prove            *)
(*     ASSUME NEW R, NEW S, NEW x \\in S, NEW y \\in S,                      *)
(*            <<x,y>> \\in TransitiveClosureOn(R,S)                         *)
(*     PROVE  \\E n \\in Nat : \\E f \\in [0..(n+1) -> S] :                    *)
(*               /\\ \\A i \\in 0..n : <<f[i], f[i+1]>> \\in R                 *)
(*               /\\ x = f[0] /\\ y = f[n+1]                                 *)
(* which provides a more constructive characterization of transitive       *)
(* closure. The converse theorem would be proved by induction on n,        *)
(* using the above closure properties.                                     *)
(***************************************************************************)

THEOREM TransitiveClosureWF ==
          ASSUME NEW R, NEW S, IsWellFoundedOn(R,S)
          PROVE  IsWellFoundedOn(TransitiveClosureOn(R, S), S)

THEOREM WFInductiveDef ==
          ASSUME NEW Def(_,_), NEW R, NEW S, NEW f,
                 IsWellFoundedOn(R, S),
                 WFDefOn(R, S, Def),
                 OpDefinesFcn(f, S, Def)
          PROVE  WFInductiveDefines(f, S, Def)

(***************************************************************************)
(* Theorem WFInductiveDef allows us to conclude that a recursively defined *)
(* function satisfies its recursion equation.  The following result allows *)
(* us to deduce the range of this function.                                *)
(***************************************************************************)
THEOREM WFInductiveDefType ==
          ASSUME NEW Def(_,_), NEW f, NEW R, NEW S, NEW T,
                 T # {},
                 IsWellFoundedOn(R, S),
                 WFDefOn(R, S, Def),
                 WFInductiveDefines(f, S, Def),
                 \\A g \\in [S -> T], s \\in S : Def(g, s) \\in T
          PROVE  f \\in [S -> T]

 ----------------------------------------------------------------------------
(***************************************************************************)
(* Below are some theorems that allow us to derive some useful             *)
(* well-founded relations from a given well-founded relation.  First, we   *)
(* define the operator OpToRel that constructs a relation (a set of        *)
(* ordered pairs) from a relation expressed as an operator.                *)
(***************************************************************************)
OpToRel(_\\prec_, S) == {ss \\in S \\X S : ss[1] \\prec ss[2]}

(***************************************************************************)
(* To construct well-founded relations from the less-than relation on the  *)
(* natural numbers, we first prove that it is well-founded.                *)
(***************************************************************************)
THEOREM NatLessThanWellFounded == IsWellFoundedOn(OpToRel(<,Nat), Nat)

(***************************************************************************)
(* The next definition would be easier to read if we used the TLA+         *)
(* construct {<<x, y>> \\in T : ...  }.  However, TLAPS does not suport     *)
(* that notation.  (It's meaning is rather complicated in the general case *)
(* when T is not a Cartesian product of sets.)                             *)
(***************************************************************************)
PreImage(f(_), S, R) == {ss \\in S \\X S : <<f(ss[1]), f(ss[2])>> \\in R}

THEOREM PreImageWellFounded ==
          ASSUME NEW S, NEW T, NEW R, NEW f(_),
                 \\A s \\in S : f(s) \\in T,
                 IsWellFoundedOn(R, T)
          PROVE  IsWellFoundedOn(PreImage(f, S, R), S)

(***************************************************************************)
(* We now prove that the lexicographical ordering on the Cartesian product *)
(* of two well-ordered sets is well-ordered.                               *)
(***************************************************************************)
LexPairOrdering(R1, R2, S1, S2) ==
     {ss \\in (S1 \\X S2) \\X (S1 \\X S2) :
         \\/ <<ss[1][1], ss[2][1]>> \\in R1
         \\/ /\\ ss[1][1] = ss[2][1]
            /\\ <<ss[1][2], ss[2][2]>> \\in R2}

THEOREM WFLexPairOrdering ==
          ASSUME NEW R1, NEW R2, NEW S1, NEW S2,
                 IsWellFoundedOn(R1, S1),
                 IsWellFoundedOn(R2, S2)
          PROVE  IsWellFoundedOn(LexPairOrdering(R1, R2, S1, S2), S1 \\X S2)

(***************************************************************************)
(* The preceding theorem generalizes in the obvious way to the Cartesian   *)
(* product of a finite number of well-ordered sets.  However, the          *)
(* statement of the general theorem is rather complicated, so we state it  *)
(* for the most useful case: the Cartesian product of n copies of the same *)
(* set.                                                                    *)
(***************************************************************************)
LexProductOrdering(R, S, n) ==
   { ff \\in [1..n -> S] \\X [1..n -> S] :
       \\E j \\in 1..n :
          /\\ \\A i \\in 1..(j-1) : ff[1][i] = ff[2][i]
          /\\ <<ff[1][j], ff[2][j]>> \\in R }

THEOREM WFLexProductOrdering ==
  ASSUME NEW R, NEW S, NEW n \\in Nat,
         IsWellFoundedOn(R, S)
  PROVE  IsWellFoundedOn(LexProductOrdering(R, S, n), [1..n -> S])

=============================================================================
\\* Modification History
\\* Last modified Thu Aug 22 18:31:26 CEST 2019 by merz
\\* Last modified Sun Jan 01 18:39:23 CET 2012 by merz
\\* Last modified Wed Nov 23 10:13:18 PST 2011 by lamport
`,
  ],
]);
