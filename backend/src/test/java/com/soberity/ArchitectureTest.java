package com.soberity;

import static com.tngtech.archunit.library.dependencies.SlicesRuleDefinition.slices;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.lang.syntax.ArchRuleDefinition;

@AnalyzeClasses(packages = "com.soberity", importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {

    @ArchTest
    static final ArchRule modulesAreFreeOfCycles =
            slices().matching("com.soberity.(*)..").should().beFreeOfCycles();

    @ArchTest
    static final ArchRule commonDoesNotDependOnFeatureModules =
            ArchRuleDefinition.noClasses().that().resideInAPackage("com.soberity.common..")
                    .should().dependOnClassesThat()
                    .resideInAnyPackage("com.soberity.identity..", "com.soberity.profile..", "com.soberity.evidence..");

    @ArchTest
    static final ArchRule identityDoesNotDependOnProfile =
            ArchRuleDefinition.noClasses().that().resideInAPackage("com.soberity.identity..")
                    .should().dependOnClassesThat().resideInAPackage("com.soberity.profile..");
}
