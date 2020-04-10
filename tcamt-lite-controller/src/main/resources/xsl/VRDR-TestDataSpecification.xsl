<xsl:stylesheet xmlns="http://www.w3.org/1999/xhtml" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xi="http://www.w3.org/2001/XInclude" xmlns:util="http://hl7.nist.gov/data-specs/util" exclude-result-prefixes="xs" version="2.0">
	<!-- param: output   values: json | jquery-tab-html | ng-tab-html    default: plain-html -->
	<!--xsl:param name="output" select="'json'" /-->
	<!--xsl:param name="output" select="'jquery-tab-html'" -->
	<xsl:param name="output" select="'plain-html'"/>
	<!--	<xsl:param name="output" select="'ng-tab-html'"/>
-->
	<xsl:variable name="version" select="'1.0'"/>
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- character map is used for being able to output these special html entities directly after escaping -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<xsl:character-map name="tags">
		<xsl:output-character character="&lt;" string="&lt;"/>
		<xsl:output-character character="&gt;" string="&gt;"/>
	</xsl:character-map>
	<xsl:output method="html" use-character-maps="tags"/>
	<xsl:variable name="generate-plain-html" select="$output = 'plain-html' or $output = 'ng-tab-html'"/>
	<!--  Use this section for supportd profiles -->
	<xsl:variable name="VR" select="'VR'"/>
	<xsl:variable name="br">
		<xsl:value-of select="util:tag('br/', '')"/>
	</xsl:variable>
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!--  ROOT TEMPLATE. Call corresponding sub templates based on the output desired (parametrized) -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<xsl:template match="*">
		<xsl:choose>
			<xsl:when test="$output = 'json'">
				<xsl:call-template name="main"/>
			</xsl:when>
			<xsl:when test="$output = 'plain-html'">
				<xsl:call-template name="plain-html"/>
			</xsl:when>
			<xsl:when test="$output = 'ng-tab-html'">
				<xsl:call-template name="ng-tab-html"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:call-template name="main-html"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- This generates the structured DATA (json if output is 'json' and html if it is 'plain-html'. Note that the main-html/jquery-tab-html call this in return -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<xsl:template name="main">
		<!-- Add profile information if it is json -->
		<xsl:value-of select="util:start(name(.), 'test-data-specs-main')"/>
		<!-- - - - programatically determine if it is a VXU or a QBP - -->
		<xsl:if test="$output = 'ng-tab-html'">
			<xsl:variable name="full">
				<xsl:call-template name="_main"/>
			</xsl:variable>
			<xsl:value-of select="util:begin-tab('FULL', 'All Segments', '', false())"/>
			<xsl:value-of select="util:strip-tabsets($full)"/>
			<xsl:value-of select="util:end-tab($ind1, false())"/>
		</xsl:if>
		<xsl:call-template name="_main"/>
		<xsl:value-of select="util:end($ind1)"/>
	</xsl:template>
	<xsl:template name="_main">
		<xsl:variable name="message-type">
			<xsl:value-of select="$VR"/>
		</xsl:variable>
		<xsl:variable name="MSH-21" select="//MSH.21.1"/>
		<xsl:variable name="group-type">
			<xsl:choose>
				<xsl:when test="starts-with($MSH-21,'PSDI')">
					<xsl:value-of select="'PSDI'"/>
				</xsl:when>
				<xsl:when test="starts-with($MSH-21,'JDI')">
					<xsl:value-of select="'JDI'"/>
				</xsl:when>
				<xsl:when test="starts-with($MSH-21,'CCOD')">
					<xsl:value-of select="'CCOD'"/>
				</xsl:when>
			</xsl:choose>
		</xsl:variable>
		<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
		<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
		<!-- - - - - - VR segments - - - - - - - - - - - - -->
		<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
		<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
		<xsl:if test="$group-type = 'PSDI'">
			<xsl:call-template name="display-repeating-segment-in-accordion">
				<xsl:with-param name="segments" select="//PID"/>
				<xsl:with-param name="mode" select="'PSDI'"/>
			</xsl:call-template>
			<xsl:call-template name="display-repeating-segment-in-accordion">
				<xsl:with-param name="segments" select="//PDA"/>
				<xsl:with-param name="mode" select="'PSDI'"/>
			</xsl:call-template>
			<!-- all OBXs are merged into one table -->
			<xsl:if test="count(//OBX) >1">
				<xsl:value-of select="util:title('title', 'Death Report Observations', 'Death Report Observations', $ind1, true(), false(), false())"/>
				<xsl:value-of select="util:elements-obx($ind1)"/>
				<xsl:for-each-group select="//OBX" group-by="string(./OBX.4)">
					<xsl:for-each select="current-group()">
						<xsl:apply-templates select="." mode="PSDI"/>
					</xsl:for-each>
					<xsl:if test="position() != last()">
						<xsl:value-of select="util:tag('tr height=20px', $ind1)"/>
						<xsl:value-of select="util:tag('td colspan=2, bgcolor=#D3D3D3', $ind1)"/>
						<xsl:value-of select="'  '"/>
						<xsl:value-of select="util:tag('/td', $ind1)"/>
						<xsl:value-of select="util:tag('/tr', $ind1)"/>
					</xsl:if>
				</xsl:for-each-group>
			</xsl:if>
		</xsl:if>
		<xsl:if test="$group-type = 'JDI'">
			<xsl:call-template name="display-repeating-segment-in-accordion">
				<xsl:with-param name="segments" select="//PID"/>
				<xsl:with-param name="mode" select="'JDI'"/>
			</xsl:call-template>
			<xsl:call-template name="display-repeating-segment-in-accordion">
				<xsl:with-param name="segments" select="//PDA"/>
				<xsl:with-param name="mode" select="'JDI'"/>
			</xsl:call-template>
			<xsl:if test="count(//OBX) >1">
				<!-- all OBXs are merged into one table -->
				<xsl:value-of select="util:title('title', 'Death Report Observations', 'Death Report Observations', $ind1, true(), false(), false())"/>
				<xsl:value-of select="util:elements-obx($ind1)"/>
				<xsl:for-each-group select="//OBX" group-by="string(./OBX.4)">
					<xsl:for-each select="current-group()">
						<xsl:apply-templates select="." mode="JDI"/>
					</xsl:for-each>
					<xsl:if test="position() != last()">
						<xsl:value-of select="util:tag('tr height=20px', $ind1)"/>
						<xsl:value-of select="util:tag('td colspan=2, bgcolor=#D3D3D3', $ind1)"/>
						<xsl:value-of select="'  '"/>
						<xsl:value-of select="util:tag('/td', $ind1)"/>
						<xsl:value-of select="util:tag('/tr', $ind1)"/>
					</xsl:if>
				</xsl:for-each-group>
			</xsl:if>
		</xsl:if>
		<xsl:if test="$group-type = 'CCOD'">
			<xsl:call-template name="display-repeating-segment-in-accordion">
				<xsl:with-param name="segments" select="//PID"/>
				<xsl:with-param name="mode" select="'CCOD'"/>
			</xsl:call-template>
			<xsl:call-template name="display-repeating-segment-in-accordion">
				<xsl:with-param name="segments" select="//PDA"/>
				<xsl:with-param name="mode" select="'CCOD'"/>
			</xsl:call-template>
			<xsl:if test="count(//OBX) >1">
				<!-- all OBXs are merged into one table -->
				<xsl:value-of select="util:title('title', 'Death Report Observations', 'Death Report Observations', $ind1, true(), false(), false())"/>
				<xsl:value-of select="util:elements-obx($ind1)"/>
				<xsl:for-each-group select="//OBX" group-by="string(./OBX.4)">
					<xsl:for-each select="current-group()">
						<xsl:apply-templates select="." mode="CCOD"/>
					</xsl:for-each>
					<xsl:if test="position() != last()">
						<xsl:value-of select="util:tag('tr height=20px', $ind1)"/>
						<xsl:value-of select="util:tag('td colspan=2, bgcolor=#D3D3D3', $ind1)"/>
						<xsl:value-of select="'  '"/>
						<xsl:value-of select="util:tag('/td', $ind1)"/>
						<xsl:value-of select="util:tag('/tr', $ind1)"/>
					</xsl:if>
				</xsl:for-each-group>
			</xsl:if>
		</xsl:if>
	</xsl:template>
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- Indentation values so that the output is readable -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<xsl:variable name="ind1" select="'&#x9;&#x9;'"/>
	<xsl:variable name="ind2" select="'&#x9;&#x9;&#x9;&#x9;&#x9;'"/>
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - display-segment-in-groups - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<xsl:template name="display-repeating-segment-in-accordion">
		<xsl:param name="segments"/>
		<xsl:param name="mode"/>
		<xsl:variable name="multiple-segs" as="xs:boolean">
			<xsl:value-of select="count($segments) &gt; 1"/>
		</xsl:variable>
		<xsl:if test="$multiple-segs">
			<xsl:value-of select="util:title('title', concat(util:segdesc(name($segments[1])), '[*]'),  concat(util:segdesc(name($segments[1])), '[*]'), $ind1, false(), false(), false())"/>
			<xsl:value-of select="util:tag('accordion', '')"/>
		</xsl:if>
		<xsl:for-each select="$segments">
			<xsl:variable name="index">
				<xsl:if test="$multiple-segs">
					<xsl:value-of select="concat(' - ', position())"/>
				</xsl:if>
			</xsl:variable>
			<xsl:call-template name="segments">
				<xsl:with-param name="vertical-orientation" as="xs:boolean" select="$multiple-segs"/>
				<xsl:with-param name="counter" select="$index"/>
				<xsl:with-param name="mode" select="$mode"/>
			</xsl:call-template>
		</xsl:for-each>
		<xsl:if test="$multiple-segs">
			<xsl:value-of select="util:tag('/accordion', '')"/>
			<xsl:value-of select="util:end-tab($ind1, false())"/>
		</xsl:if>
	</xsl:template>
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!--  since mode parameter cannot be dynamic, using this approach which simply expands with xsl:when and calls the segments with different modes as constants -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<xsl:template name="segments">
		<xsl:param name="vertical-orientation" as="xs:boolean"/>
		<xsl:param name="counter"/>
		<xsl:param name="mode"/>
		<xsl:choose>
			<xsl:when test="$mode = 'PSDI'">
				<xsl:apply-templates select="." mode="PSDI">
					<xsl:with-param name="vertical-orientation" as="xs:boolean" select="$vertical-orientation"/>
					<xsl:with-param name="counter" select="$counter"/>
				</xsl:apply-templates>
			</xsl:when>
			<xsl:when test="$mode = 'JDI'">
				<xsl:apply-templates select="." mode="JDI">
					<xsl:with-param name="vertical-orientation" as="xs:boolean" select="$vertical-orientation"/>
					<xsl:with-param name="counter" select="$counter"/>
				</xsl:apply-templates>
			</xsl:when>
			<xsl:when test="$mode = 'CCOD'">
				<xsl:apply-templates select="." mode="CCOD">
					<xsl:with-param name="vertical-orientation" as="xs:boolean" select="$vertical-orientation"/>
					<xsl:with-param name="counter" select="$counter"/>
				</xsl:apply-templates>
			</xsl:when>
		</xsl:choose>
	</xsl:template>
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - Patient information - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<xsl:template match="PID" mode="PSDI">
		<xsl:param name="vertical-orientation" as="xs:boolean"/>
		<xsl:param name="counter"/>
		<xsl:value-of select="util:title('title', concat('Patient Information', $counter), 'Patient Information', $ind1, false(), $vertical-orientation, false())"/>
		<xsl:value-of select="util:elements($ind1)"/>
		<xsl:value-of select="util:element('Patient Name', concat(util:format-with-space(.//PID.5.2), util:format-with-space(.//PID.5.3),.//PID.5.1.1), $ind1)"/>
		<xsl:value-of select="util:element('ID Number', string-join((.//PID.3.1),', '), $ind1)"/>
		<xsl:value-of select="util:element('Date/Time of Birth',util:format-date(.//PID.7), $ind1)"/>
		<xsl:value-of select="util:element('Administrative Sex', util:admin-sex(.//PID.8), $ind1)"/>
		<xsl:for-each select="PID.11">
			<xsl:value-of select="util:element(concat('Patient Address', ' ', util:blank-if-1(position(), count(..//PID.11))), util:format-address(PID.11.1/PID.11.1.1, PID.11.3, PID.11.4, PID.11.5, PID.11.6), $ind1)"/>
		</xsl:for-each>
		<xsl:value-of select="util:element('Patient Death  Date and Time',util:format-time(.//PID.29), $ind1)"/>
		<xsl:value-of select="util:last-element('Patient Death Indicator',util:protection-indicator(normalize-space(.//PID.30)), $ind1, $vertical-orientation, false())"/>
	</xsl:template>
	<xsl:template match="PID" mode="JDI">
		<xsl:param name="vertical-orientation" as="xs:boolean"/>
		<xsl:param name="counter"/>
		<xsl:value-of select="util:title('title', concat('Patient Information', $counter), 'Patient Information', $ind1, false(), $vertical-orientation, false())"/>
		<xsl:value-of select="util:elements($ind1)"/>
		<xsl:value-of select="util:element('Patient Name', concat(util:format-with-space(.//PID.5.2), util:format-with-space(.//PID.5.3),.//PID.5.1.1), $ind1)"/>
		<xsl:value-of select="util:element('ID Number', string-join((.//PID.3.1),', '), $ind1)"/>
		<xsl:value-of select="util:element('Date/Time of Birth',util:format-date(.//PID.7), $ind1)"/>
		<xsl:value-of select="util:element('Administrative Sex', util:admin-sex(.//PID.8), $ind1)"/>
		<xsl:value-of select="util:element('Race', string-join((.//PID.10.2),', '), $ind1)"/>
		<xsl:value-of select="util:element('Marital Status', .//PID.16.2, $ind1)"/>
		<xsl:value-of select="util:element('Ethnic Group', .//PID.22.2, $ind1)"/>
		<xsl:for-each select="PID.11">
			<xsl:value-of select="util:element(concat('Patient Address', ' ', util:blank-if-1(position(), count(..//PID.11))), util:format-address(PID.11.1/PID.11.1.1, PID.11.3, PID.11.4, PID.11.5, PID.11.6), $ind1)"/>
		</xsl:for-each>
		<xsl:value-of select="util:element('Patient Death  Date and Time',util:format-time(.//PID.29), $ind1)"/>
		<xsl:value-of select="util:last-element('Patient Death Indicator',util:protection-indicator(normalize-space(.//PID.30)), $ind1, $vertical-orientation, false())"/>
	</xsl:template>
	<xsl:template match="PID" mode="CCOD">
		<xsl:param name="vertical-orientation" as="xs:boolean"/>
		<xsl:param name="counter"/>
		<xsl:value-of select="util:title('title', concat('Patient Information', $counter), 'Patient Information', $ind1, false(), $vertical-orientation, false())"/>
		<xsl:value-of select="util:elements($ind1)"/>
		<xsl:value-of select="util:element('Patient Name', concat(util:format-with-space(.//PID.5.2), util:format-with-space(.//PID.5.3),.//PID.5.1.1), $ind1)"/>
		<xsl:value-of select="util:element('ID Number', string-join((.//PID.3.1),', '), $ind1)"/>
		<xsl:value-of select="util:element('Patient Death  Date and Time',util:format-time(.//PID.29), $ind1)"/>
		<xsl:value-of select="util:last-element('Patient Death Indicator',util:protection-indicator(normalize-space(.//PID.30)), $ind1, $vertical-orientation, false())"/>
	</xsl:template>
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - Patient Death And Autopsy Information  - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<xsl:template match="PDA" mode="PSDI">
		<xsl:param name="vertical-orientation" as="xs:boolean"/>
		<xsl:param name="counter"/>
		<xsl:value-of select="util:title('title', concat('Patient Death And Autopsy Information ', $counter), 'Patient Death And Autopsy Information ', $ind1, false(), $vertical-orientation, false())"/>
		<xsl:value-of select="util:elements($ind1)"/>
		<xsl:value-of select="util:element('Death Location', .//PDA.2.9, $ind1)"/>
		<xsl:value-of select="util:element('Death Certificate Signed Date/Time', util:format-time(.//PDA.4), $ind1)"/>
		<xsl:value-of select="util:element('Death Certified By', concat(util:format-with-space(.//PDA.5.3), util:format-with-space(.//PDA.5.2.1)), $ind1)"/>
		<xsl:value-of select="util:element('Autopsy Indicator', util:protection-indicator(normalize-space(.//PDA.6)), $ind1)"/>
		<xsl:value-of select="util:element('Autopsy Performed By', concat(util:format-with-space(.//PDA.8.6), util:format-with-space(.//PDA.8.3),.//PDA.8.2.1), $ind1)"/>
		<xsl:value-of select="util:last-element('Coroner Indicator',util:protection-indicator(normalize-space(.//PDA.9)), $ind1, $vertical-orientation, false())"/>
	</xsl:template>
	<xsl:template match="PDA" mode="JDI">
		<xsl:param name="vertical-orientation" as="xs:boolean"/>
		<xsl:param name="counter"/>
		<xsl:value-of select="util:title('title', concat('Patient Death And Autopsy Information ', $counter), 'Patient Death And Autopsy Information ', $ind1, false(), $vertical-orientation, false())"/>
		<xsl:value-of select="util:elements($ind1)"/>
		<xsl:value-of select="util:element('Death Location', .//PDA.2.9, $ind1)"/>
		<xsl:value-of select="util:last-element('Autopsy Indicator', util:protection-indicator(normalize-space(.//PDA.6)), $ind1, $vertical-orientation, false())"/>
	</xsl:template>
	<xsl:template match="PDA" mode="CCOD"/>
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!--  Death Report Observations -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<xsl:template match="OBX" mode="PSDI">
		<xsl:variable name="OBX-2" select=".//OBX.2"/>
		<xsl:choose>
			<xsl:when test="$OBX-2 = 'CWE'">
				<xsl:if test=".//OBX.5.2/text()">
					<xsl:value-of select="util:element(.//OBX.3.2,.//OBX.5.2, $ind1)"/>
				</xsl:if>
				<xsl:if test=".//OBX.5.9/text()">
					<xsl:value-of select="util:element(.//OBX.3.2,.//OBX.5.9, $ind1)"/>
				</xsl:if>
			</xsl:when>
			<xsl:when test="$OBX-2 = 'CE'">
				<xsl:if test=".//OBX.5.2/text()">
					<xsl:value-of select="util:element(.//OBX.3.2,.//OBX.5.2, $ind1)"/>
				</xsl:if>
				<xsl:if test=".//OBX.5.9/text()">
					<xsl:value-of select="util:element(.//OBX.3.2,.//OBX.5.9, $ind1)"/>
				</xsl:if>
			</xsl:when>
			<xsl:when test="$OBX-2 = 'DTM'">
				<xsl:value-of select="util:element(.//OBX.3.2,util:format-time(.//OBX.5.1), $ind1)"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="util:element(.//OBX.3.2,.//OBX.5, $ind1)"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	<xsl:template match="OBX" mode="JDI">
		<xsl:variable name="OBX-2" select=".//OBX.2"/>
		<xsl:choose>
			<xsl:when test="$OBX-2 = 'CWE'">
				<xsl:if test=".//OBX.5.2/text()">
					<xsl:value-of select="util:element(.//OBX.3.2,.//OBX.5.2, $ind1)"/>
				</xsl:if>
				<xsl:if test=".//OBX.5.9/text()">
					<xsl:value-of select="util:element(.//OBX.3.2,.//OBX.5.9, $ind1)"/>
				</xsl:if>
			</xsl:when>
			<xsl:when test="$OBX-2 = 'CE'">
				<xsl:if test=".//OBX.5.2/text()">
					<xsl:value-of select="util:element(.//OBX.3.2,.//OBX.5.2, $ind1)"/>
				</xsl:if>
				<xsl:if test=".//OBX.5.9/text()">
					<xsl:value-of select="util:element(.//OBX.3.2,.//OBX.5.9, $ind1)"/>
				</xsl:if>
			</xsl:when>
			<xsl:when test="$OBX-2 = 'DTM'">
				<xsl:value-of select="util:element(.//OBX.3.2,util:format-time(.//OBX.5.1), $ind1)"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="util:element(.//OBX.3.2,.//OBX.5, $ind1)"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	<xsl:template match="OBX" mode="CCOD">
		<xsl:variable name="OBX-2" select=".//OBX.2"/>
		<xsl:choose>
			<xsl:when test="$OBX-2 = 'CWE'">
				<xsl:if test=".//OBX.5.2/text()">
					<xsl:value-of select="util:element(.//OBX.3.2,.//OBX.5.2, $ind1)"/>
				</xsl:if>
				<xsl:if test=".//OBX.5.9/text()">
					<xsl:value-of select="util:element(.//OBX.3.2,.//OBX.5.9, $ind1)"/>
				</xsl:if>
			</xsl:when>
			<xsl:when test="$OBX-2 = 'CE'">
				<xsl:if test=".//OBX.5.2/text()">
					<xsl:value-of select="util:element(.//OBX.3.2,.//OBX.5.2, $ind1)"/>
				</xsl:if>
				<xsl:if test=".//OBX.5.9/text()">
					<xsl:value-of select="util:element(.//OBX.3.2,.//OBX.5.9, $ind1)"/>
				</xsl:if>
			</xsl:when>
			<xsl:when test="$OBX-2 = 'DTM'">
				<xsl:value-of select="util:element(.//OBX.3.2,util:format-time(.//OBX.5.1), $ind1)"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="util:element(.//OBX.3.2,.//OBX.5, $ind1)"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  Iincludes - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:format-trailing">
		<xsl:param name="value"/>
		<xsl:param name="padding"/>
		<xsl:value-of select="$value"/>
		<xsl:if test="$value != ''">
			<xsl:value-of select="$padding"/>
		</xsl:if>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:format-with-space">
		<xsl:param name="value"/>
		<xsl:value-of select="util:format-trailing($value, ' ')"/>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:format-tel">
		<xsl:param name="areacode"/>
		<xsl:param name="phonenumberin"/>
		<!-- pad it so that length problems don't happen -->
		<xsl:variable name="phonenumber" select="concat($phonenumberin, '                ')"/>
		<xsl:if test="$areacode != '' and $phonenumber != ''">
			<xsl:variable name="areaCode" select="concat('(',$areacode,')')"/>
			<xsl:variable name="localCode" select="concat(substring($phonenumber,1,3),'-')"/>
			<xsl:variable name="idCode" select="substring($phonenumber,4,4)"/>
			<xsl:value-of select="concat($areaCode,$localCode,$idCode)"/>
		</xsl:if>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:format-address">
		<xsl:param name="street"/>
		<xsl:param name="city"/>
		<xsl:param name="state"/>
		<xsl:param name="zip"/>
		<xsl:param name="country"/>
		<xsl:value-of select="concat(util:format-with-space($street), util:format-with-space($city), util:format-with-space($state), util:format-with-space($zip), util:format-with-space($country))"/>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:tags">
		<xsl:param name="tag"/>
		<xsl:param name="content"/>
		<xsl:param name="ind"/>
		<xsl:value-of select="concat($nl, $ind)"/>
		<xsl:text disable-output-escaping="yes">&lt;</xsl:text>
		<xsl:value-of select="$tag"/>
		<xsl:text disable-output-escaping="yes">&gt;</xsl:text>
		<xsl:value-of select="$content"/>
		<xsl:text disable-output-escaping="yes">&lt;/</xsl:text>
		<xsl:value-of select="$tag"/>
		<xsl:text disable-output-escaping="yes">&gt;</xsl:text>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:tag">
		<xsl:param name="tag"/>
		<xsl:param name="ind"/>
		<xsl:value-of select="concat($nl, $ind)"/>
		<xsl:text disable-output-escaping="yes">&lt;</xsl:text>
		<xsl:value-of select="$tag"/>
		<xsl:text disable-output-escaping="yes">&gt;</xsl:text>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:format-date">
		<xsl:param name="elementDataIn"/>
		<xsl:if test="string-length($elementDataIn) = 4">
			<!-- YEAR only -->
			<xsl:variable name="year" select="substring($elementDataIn,1,4)"/>
			<xsl:value-of select="$year"/>
		</xsl:if>
		<xsl:if test="string-length($elementDataIn) &gt; 4">
			<!-- pad it so that length problems don't happen -->
			<xsl:variable name="elementData" select="concat($elementDataIn, '                  ')"/>
			<xsl:if test="string-length(normalize-space($elementData)) &gt; 0">
				<xsl:variable name="year" select="substring($elementData,1,4)"/>
				<xsl:variable name="month" select="concat(substring($elementData,5,2),'/')"/>
				<xsl:variable name="day" select="concat(substring($elementData,7,2),'/')"/>
				<xsl:variable name="hour" select="concat(' ', substring($elementData,9,2), ':')"/>
				<xsl:variable name="min" select="concat(substring($elementData,11,2),' ')"/>
				<xsl:variable name="time">
					<xsl:if test="string-length(normalize-space($elementDataIn)) &gt; 11">
						<xsl:value-of select="concat($hour, $min)"/>
					</xsl:if>
				</xsl:variable>
				<xsl:value-of select="concat($month,$day,$year, $time)"/>
				<!-- <xsl:value-of select="format-date(xs:date(concat($month,$day,$year)),'[D1o] 
				[MNn], [Y]', 'en', (), ())"/> -->
			</xsl:if>
		</xsl:if>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:format-time">
		<xsl:param name="time"/>
		<xsl:choose>
			<xsl:when test="string-length(normalize-space($time)) &lt; 9">
				<xsl:value-of select="util:format-date($time)"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:variable name="year" select="substring($time,1,4)"/>
				<xsl:variable name="month" select="concat(substring($time,5,2),'/')"/>
				<xsl:variable name="day" select="concat(substring($time,7,2),'/')"/>
				<xsl:variable name="hrs" select="substring($time,9,2)"/>
				<xsl:variable name="cHrs">
					<xsl:choose>
						<xsl:when test="number($hrs) &gt; 12">
							<xsl:variable name="tHr" select="number($hrs) - 12"/>
							<xsl:choose>
								<xsl:when test="string-length(string($tHr)) = 1">
									<xsl:value-of select="concat('0',$tHr)"/>
								</xsl:when>
								<xsl:otherwise>
									<xsl:value-of select="$tHr"/>
								</xsl:otherwise>
							</xsl:choose>
						</xsl:when>
						<xsl:when test="number($hrs) &lt; 12 or number($hrs) = 12">
							<xsl:value-of select="$hrs"/>
						</xsl:when>
					</xsl:choose>
				</xsl:variable>
				<xsl:variable name="mins" select="concat(':',substring($time,11,2))"/>
				<xsl:variable name="time-format" select="format-time(xs:time(concat($cHrs,$mins,':00')),'[H]:[m]')"/>
				<xsl:variable name="AM-PM">
					<xsl:choose>
						<xsl:when test="number($hrs) &gt; 12">
							<xsl:value-of select="'PM'"/>
						</xsl:when>
						<xsl:when test="number($hrs) &lt; 12">
							<xsl:value-of select="'AM'"/>
						</xsl:when>
					</xsl:choose>
				</xsl:variable>
				<xsl:value-of select="concat($month,$day,$year,' ',$time-format,' ',$AM-PM)"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:start">
		<xsl:param name="profile"/>
		<xsl:param name="div"/>
		<xsl:choose>
			<xsl:when test="$generate-plain-html">
				<!-- output version number and profile info at the start with the comment -->
				<xsl:variable name="comment-string">
					<xsl:value-of select="'!-- generated by common_tdspec.xslt Version:'"/>
					<xsl:value-of select="$version"/>
					<xsl:value-of select="'   Profile:'"/>
					<xsl:value-of select="$profile"/>
					<xsl:value-of select="'--'"/>
				</xsl:variable>
				<xsl:value-of select="util:tag($comment-string, '')"/>
				<xsl:value-of select="util:tag('fieldset', '')"/>
				<xsl:value-of select="util:tag(concat('div class=&quot;',  $div, '&quot;'), '')"/>
				<!-- generate tabset outer block for angular -->
				<xsl:if test="$output = 'ng-tab-html'">
					<xsl:value-of select="util:tag('tabset', '')"/>
				</xsl:if>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="concat('{', $nl, '&quot;version&quot; : &quot;', $version, '&quot;,', $nl, '&quot;profile&quot; : &quot;', $profile, '&quot;,', $nl, '&quot;tables&quot;:', $nl, '[', $nl)"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:begin-sub-table">
		<xsl:param name="ind"/>
		<xsl:choose>
			<xsl:when test="$generate-plain-html">
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="concat($nl, $ind, '{&quot;element&quot; : &quot;obx&quot;, &quot;data&quot; : ', $nl)"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:end-obx-group">
		<xsl:param name="ind"/>
		<xsl:choose>
			<xsl:when test="$generate-plain-html">
				<xsl:value-of select="util:tag('tr class=''obxGrpSpl''', $ind)"/>
				<xsl:value-of select="util:tag('td colspan=''2''', $ind)"/>
				<xsl:value-of select="util:tag('/td', $ind)"/>
				<xsl:value-of select="util:tag('/tr', $ind)"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="util:element('', '', $ind)"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:function>
	<xsl:variable xmlns:xalan="http://xml.apache.org/xslt" name="indent" select="'&#x9;'"/>
	<xsl:variable xmlns:xalan="http://xml.apache.org/xslt" name="nl" select="'&#xA;'"/>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:title">
		<xsl:param name="name"/>
		<xsl:param name="tabname"/>
		<xsl:param name="value"/>
		<xsl:param name="ind"/>
		<xsl:param name="endprevioustable" as="xs:boolean"/>
		<xsl:param name="vertical-orientation" as="xs:boolean"/>
		<xsl:param name="full" as="xs:boolean"/>
		<xsl:value-of select="util:_title($name, $tabname, $value, '', $ind, $endprevioustable, $vertical-orientation, $full)"/>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:_title">
		<xsl:param name="name"/>
		<xsl:param name="tabname"/>
		<xsl:param name="value"/>
		<xsl:param name="additionalvalue"/>
		<xsl:param name="ind"/>
		<xsl:param name="endprevioustable" as="xs:boolean"/>
		<xsl:param name="vertical-orientation" as="xs:boolean"/>
		<xsl:param name="full" as="xs:boolean"/>
		<xsl:variable name="prelude">
			<xsl:choose>
				<xsl:when test="$endprevioustable">
					<xsl:choose>
						<xsl:when test="$generate-plain-html">
							<xsl:value-of select="util:tag('/table', $ind)"/>
							<xsl:value-of select="util:tag('br/', $ind)"/>
							<xsl:value-of select="util:end-tab($ind, $vertical-orientation)"/>
						</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="concat($ind, '},', $nl)"/>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:when>
				<xsl:otherwise>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:choose>
			<xsl:when test="$generate-plain-html">
				<xsl:if test="not($full)">
					<xsl:value-of select="util:_begin-tab($tabname, $value, $additionalvalue, '', $vertical-orientation)"/>
				</xsl:if>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="concat($prelude, $ind, '{', $nl, $ind, $indent, '&quot;', $name, '&quot;', ':', '&quot;', $value, '&quot;,', $nl)"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:title-no-tab">
		<xsl:param name="name"/>
		<xsl:param name="tabname"/>
		<xsl:param name="value"/>
		<xsl:param name="ind"/>
		<xsl:param name="endprevioustable" as="xs:boolean"/>
		<xsl:choose>
			<xsl:when test="$output = 'ng-tab-html'">
				<xsl:value-of select="util:tag('fieldset', $ind)"/>
				<xsl:value-of select="util:tags('legend', $value, $ind)"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="util:title($name, $tabname, $value, $ind, $endprevioustable, false(), true())"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:end-title-no-tab">
		<xsl:param name="ind"/>
		<xsl:choose>
			<xsl:when test="$output = 'ng-tab-html'">
				<xsl:value-of select="util:tag('/fieldset', $ind)"/>
			</xsl:when>
			<xsl:otherwise>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:begin-tab">
		<xsl:param name="tabname"/>
		<xsl:param name="val"/>
		<xsl:param name="ind"/>
		<xsl:param name="vertical-orientation" as="xs:boolean"/>
		<xsl:value-of select="util:_begin-tab($tabname, $val, '', $ind, $vertical-orientation)"/>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:_begin-tab">
		<xsl:param name="tabname"/>
		<xsl:param name="val"/>
		<xsl:param name="additionalval"/>
		<xsl:param name="ind"/>
		<xsl:param name="vertical-orientation" as="xs:boolean"/>
		<!-- use the tabname to convert into a valid javascript variable name that is used to track open and close of the accordions -->
		<xsl:variable name="isOpenVar" select="concat('xsl', replace($tabname, '[ \\-]', ''))"/>
		<xsl:choose>
			<xsl:when test="$output = 'ng-tab-html'">
				<xsl:value-of select="util:tag(concat(util:IfThenElse($vertical-orientation,                   concat('accordion-group class=&quot;panel-info&quot; type=&quot;pills&quot; style=&quot;margin-top:0;border: 1px ridge  #C6DEFF;&quot; is-open=&quot;', $isOpenVar, '&quot; '), 'tab'),                   util:IfThenElse($vertical-orientation, '', concat(' heading=&quot;', $tabname, '&quot; heading2=&quot;', $additionalval, '&quot; ')), ' vertical=&quot;', $vertical-orientation, '&quot;'), '')"/>
				<xsl:if test="$vertical-orientation">
					<xsl:value-of select="util:tag('accordion-heading', '')"/>
					<xsl:value-of select="util:tag('span class=&quot;clearfix&quot;', '')"/>
					<xsl:value-of select="util:tag('span class=&quot;accordion-heading pull-left&quot;', '')"/>
					<xsl:value-of select="util:tag(concat('i class=&quot;pull-left fa&quot; ng-class=&quot;{''fa-caret-down'': ', $isOpenVar, ', ''fa-caret-right'': !', $isOpenVar, '}&quot;'), '')"/>
					<xsl:value-of select="util:tag('/i', '')"/>
					<xsl:value-of select="$tabname"/>
					<xsl:value-of select="util:tag('/span', '')"/>
					<xsl:value-of select="util:tag('/span', '')"/>
					<xsl:value-of select="util:tag('/accordion-heading', '')"/>
				</xsl:if>
				<xsl:value-of select="util:tag('div class=&quot;panel panel-info&quot;', $ind)"/>
				<xsl:value-of select="util:tag('div class=&quot;panel-body&quot;', $ind)"/>
				<xsl:value-of select="util:tag('fieldset', $ind)"/>
			</xsl:when>
			<xsl:when test="$output = 'plain-html'">
				<xsl:value-of select="util:tag('fieldset', $ind)"/>
				<xsl:value-of select="util:tags('legend', $val, $ind)"/>
			</xsl:when>
		</xsl:choose>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:end-tab">
		<xsl:param name="ind"/>
		<xsl:param name="vertical-orientation" as="xs:boolean"/>
		<xsl:choose>
			<xsl:when test="$output = 'ng-tab-html'">
				<xsl:value-of select="util:tag('/fieldset', '')"/>
				<xsl:value-of select="util:tag('/div', '')"/>
				<xsl:value-of select="util:tag('/div', '')"/>
				<xsl:value-of select="util:tag(util:IfThenElse($vertical-orientation, '/accordion-group', '/tab'), '')"/>
			</xsl:when>
			<xsl:when test="$output = 'plain-html'">
				<xsl:value-of select="util:tag('/fieldset', '')"/>
			</xsl:when>
		</xsl:choose>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:elements">
		<xsl:param name="ind"/>
		<xsl:value-of select="util:elements-with-colspan(2, $ind)"/>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:elements-obx">
		<xsl:param name="ind"/>
		<xsl:value-of select="util:elements-with-colspan-obx(2, $ind)"/>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:elements-with-colspan">
		<xsl:param name="cols" as="xs:integer"/>
		<xsl:param name="ind"/>
		<xsl:variable name="col1span" select="floor($cols div 2)"/>
		<xsl:variable name="col2span" select="$cols - $col1span"/>
		<xsl:choose>
			<xsl:when test="$generate-plain-html">
				<xsl:value-of select="util:tag('table', $ind)"/>
				<xsl:value-of select="util:tag('tr', $ind)"/>
				<xsl:value-of select="util:tag(concat('th colspan=', $col1span), $ind)"/>
				<xsl:value-of select="'Element'"/>
				<xsl:value-of select="util:tag('/th', $ind)"/>
				<xsl:value-of select="util:tag(concat('th colspan=', $col2span), $ind)"/>
				<xsl:value-of select="'Data'"/>
				<xsl:value-of select="util:tag('/th', $ind)"/>
				<xsl:value-of select="util:tag('/tr', $ind)"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="concat($ind, $indent, '&quot;elements&quot; : ', $nl, $ind, $indent, '[')"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:elements-with-colspan-obx">
		<xsl:param name="cols" as="xs:integer"/>
		<xsl:param name="ind"/>
		<xsl:variable name="col1span" select="floor($cols div 2)"/>
		<xsl:variable name="col2span" select="$cols - $col1span"/>
		<xsl:choose>
			<xsl:when test="$generate-plain-html">
				<xsl:value-of select="util:tag('table', $ind)"/>
				<xsl:value-of select="util:tag('tr', $ind)"/>
				<xsl:value-of select="util:tag(concat('th colspan=', $col1span), $ind)"/>
				<xsl:value-of select="'Observation'"/>
				<xsl:value-of select="util:tag('/th', $ind)"/>
				<xsl:value-of select="util:tag(concat('th colspan=', $col2span), $ind)"/>
				<xsl:value-of select="'Data'"/>
				<xsl:value-of select="util:tag('/th', $ind)"/>
				<xsl:value-of select="util:tag('/tr', $ind)"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="concat($ind, $indent, '&quot;elements&quot; : ', $nl, $ind, $indent, '[')"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:title-and-elements">
		<xsl:param name="title"/>
		<xsl:param name="ind"/>
		<xsl:choose>
			<xsl:when test="$generate-plain-html">
				<xsl:value-of select="util:tag('table', $ind)"/>
				<xsl:value-of select="util:tag('tr', $ind)"/>
				<xsl:value-of select="util:tag('th colspan=2 ', $ind)"/>
				<xsl:value-of select="$title"/>
				<xsl:value-of select="util:tag('/th ', $ind)"/>
				<xsl:value-of select="util:tag('/tr', $ind)"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="concat($ind, $indent, '&quot;elements&quot; : ', $nl, $ind, $indent, '[')"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:message-elements">
		<xsl:param name="ind"/>
		<xsl:choose>
			<xsl:when test="$generate-plain-html">
				<xsl:value-of select="util:tag('table', $ind)"/>
				<xsl:value-of select="util:tag('tr', $ind)"/>
				<xsl:value-of select="util:tags('th', 'Location', $ind)"/>
				<xsl:value-of select="util:tags('th', 'Data Element', $ind)"/>
				<xsl:value-of select="util:tags('th', 'Data', $ind)"/>
				<xsl:value-of select="util:tags('th', 'Categorization', $ind)"/>
				<xsl:value-of select="util:tag('/tr', $ind)"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="concat($ind, $indent, '&quot;elements&quot; : ', $nl, $ind, $indent, '[')"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:end-sub-table">
		<xsl:param name="ind"/>
		<xsl:param name="vertical-orientation" as="xs:boolean"/>
		<xsl:choose>
			<xsl:when test="$generate-plain-html">
				<xsl:variable name="end-elements">
					<xsl:value-of select="util:tag('/table', $ind)"/>
					<xsl:value-of select="util:tag('br/', $ind)"/>
					<xsl:value-of select="util:tag('/fieldset', $ind)"/>
					<xsl:value-of select="util:end-tab($ind, $vertical-orientation)"/>
				</xsl:variable>
				<xsl:value-of select="$end-elements"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="concat($nl, $indent, ']', $ind2, '}', $nl, $ind2, '}', $nl, $ind1, ']', $nl)"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:end-elements">
		<xsl:param name="ind"/>
		<xsl:param name="vertical-orientation" as="xs:boolean"/>
		<xsl:param name="full" as="xs:boolean"/>
		<xsl:choose>
			<xsl:when test="$generate-plain-html">
				<xsl:variable name="end-elements">
					<xsl:value-of select="util:tag('/table', $ind)"/>
					<xsl:value-of select="util:tag('br/', $ind)"/>
					<xsl:if test="not($full)">
						<xsl:value-of select="util:end-tab($ind, $vertical-orientation)"/>
					</xsl:if>
				</xsl:variable>
				<xsl:value-of select="$end-elements"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="concat($ind, ']', $nl)"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:element">
		<xsl:param name="name"/>
		<xsl:param name="value"/>
		<xsl:param name="ind"/>
		<!--		<xsl:message> Processing <xsl:value-of select="$name"/>
		</xsl:message>-->
		<xsl:value-of select="util:element-with-delimiter($name, $value, ',', 2, $ind)"/>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:element-var-cols">
		<xsl:param name="name"/>
		<xsl:param name="value"/>
		<xsl:param name="cols" as="xs:integer"/>
		<xsl:param name="ind"/>
		<!--		<xsl:message> Processing <xsl:value-of select="$name"/>
		</xsl:message>-->
		<xsl:value-of select="util:element-with-delimiter($name, $value, ',', $cols, $ind)"/>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:last-element">
		<xsl:param name="name"/>
		<xsl:param name="value"/>
		<xsl:param name="ind"/>
		<xsl:param name="vertical-orientation" as="xs:boolean"/>
		<xsl:param name="full" as="xs:boolean"/>
		<xsl:choose>
			<xsl:when test="$generate-plain-html">
				<xsl:value-of select="util:element-with-delimiter($name, $value, '', 2, $ind)"/>
				<xsl:if test="not($full)">
					<xsl:value-of select="util:tag('/table', $ind)"/>
				</xsl:if>
				<xsl:value-of select="util:end-tab($ind, $vertical-orientation)"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="concat(util:element-with-delimiter($name, $value, '', 2, $ind), $nl, $ind, $indent, ']', $nl)"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:end-table">
		<xsl:param name="ind"/>
		<xsl:choose>
			<xsl:when test="$generate-plain-html">
				<xsl:value-of select="util:tag('/table', $ind)"/>
				<xsl:value-of select="util:tag('br/', $ind)"/>
			</xsl:when>
			<xsl:otherwise>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:end-table-fieldset">
		<xsl:param name="ind"/>
		<xsl:choose>
			<xsl:when test="$generate-plain-html">
				<xsl:value-of select="util:tag('/table', $ind)"/>
				<xsl:value-of select="util:tag('br/', $ind)"/>
				<xsl:value-of select="util:tag('/fieldset', $ind)"/>
			</xsl:when>
			<xsl:otherwise>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:single-element">
		<xsl:param name="name"/>
		<xsl:param name="ind"/>
		<xsl:choose>
			<xsl:when test="$generate-plain-html">
				<xsl:variable name="td-element">
					<xsl:value-of select="util:tag('td class=&quot;separator&quot; colspan=&quot;2&quot;', $ind)"/>
					<xsl:value-of select="$name"/>
					<xsl:value-of select="util:tag('/td',$ind)"/>
				</xsl:variable>
				<xsl:value-of select="util:tags('tr', $td-element, $ind)"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="util:element-with-delimiter($name, '', ',', 2, $ind)"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:element-with-delimiter">
		<xsl:param name="name"/>
		<xsl:param name="value"/>
		<xsl:param name="trailing"/>
		<xsl:param name="cols" as="xs:integer"/>
		<xsl:param name="ind"/>
		<xsl:variable name="col1span" select="floor($cols div 2)"/>
		<xsl:variable name="col2span" select="$cols - $col1span"/>
		<xsl:choose>
			<xsl:when test="$generate-plain-html">
				<xsl:variable name="td-element">
					<xsl:value-of select="util:tag(concat('td colspan=', $col1span), $ind)"/>
					<xsl:value-of select="$name"/>
					<xsl:value-of select="util:tag('/td', $ind)"/>
					<xsl:message>
						<xsl:value-of select="$name"/>
					</xsl:message>
					<xsl:choose>
						<xsl:when test="normalize-space($value) = ''">
							<xsl:value-of select="util:tag(concat('td class=''noData'' colspan=', $col2span), $ind)"/>
							<xsl:value-of select="$value"/>
							<xsl:value-of select="util:tag('/td', $ind)"/>
						</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="util:tag(concat('td colspan=', $col2span), $ind)"/>
							<xsl:value-of select="$value"/>
							<xsl:value-of select="util:tag('/td', $ind)"/>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:variable>
				<xsl:value-of select="util:tags('tr', $td-element, $ind)"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="concat($nl, $ind, $indent, $indent, '{&quot;element&quot; : &quot;', $name, '&quot;, &quot;data&quot; : &quot;', $value, '&quot;}', $trailing)"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:message-element-with-delimiter">
		<xsl:param name="location"/>
		<xsl:param name="dataelement"/>
		<xsl:param name="data"/>
		<xsl:param name="categorization"/>
		<xsl:param name="trailing"/>
		<xsl:param name="ind"/>
		<xsl:param name="item-hierarchy"/>
		<xsl:variable name="isField" as="xs:boolean" select="$item-hierarchy = 'Field'"/>
		<xsl:choose>
			<xsl:when test="$generate-plain-html">
				<xsl:variable name="td-element">
					<xsl:value-of select="util:tag(concat('td class=&quot;', $item-hierarchy, '&quot;'), $ind)"/>
					<xsl:value-of select="concat(substring($location, 1, 3), '-', substring($location, 5, string-length($location) - 4))"/>
					<xsl:value-of select="util:tag('/td', $ind)"/>
					<xsl:value-of select="util:tag(concat('td class=&quot;', $item-hierarchy, '&quot;'), $ind)"/>
					<xsl:value-of select="$dataelement"/>
					<xsl:value-of select="util:tag('/td', $ind)"/>
					<xsl:value-of select="util:tag(concat('td class=&quot;', util:IfThenElse($isField, $item-hierarchy,  util:IfEmptyThenElse($data, 'noData', 'Data')), '&quot;'), $ind)"/>
					<xsl:value-of select="$data"/>
					<xsl:value-of select="util:tag('/td', $ind)"/>
					<xsl:value-of select="util:tag(concat('td class=&quot;', util:IfThenElse($isField, $item-hierarchy, util:IfEmptyThenElse($categorization, 'noData', 'Data')), '&quot;'), $ind)"/>
					<xsl:value-of select="$categorization"/>
					<xsl:value-of select="util:tag('/td', $ind)"/>
				</xsl:variable>
				<xsl:value-of select="util:tags('tr', $td-element, $ind)"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="concat($nl, $ind, $indent, $indent,         '{&quot;location&quot; : &quot;', $location, '&quot;, &quot;dataelement&quot; : &quot;', $dataelement, '&quot;, &quot;data&quot; : &quot;', $data, '&quot;, &quot;categorization&quot; : &quot;', $categorization, '&quot;}', $trailing)"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:end">
		<xsl:param name="ind"/>
		<xsl:choose>
			<xsl:when test="$generate-plain-html">
				<xsl:if test="$output = 'ng-tab-html'">
					<xsl:value-of select="util:tag('/tabset', '')"/>
				</xsl:if>
				<xsl:value-of select="util:tag('/div', $ind)"/>
				<xsl:value-of select="util:tag('/fieldset', '')"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="concat($nl, $ind, '}', $nl, ']', $nl, '}')"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:blank-if-1">
		<xsl:param name="pos"/>
		<xsl:param name="total"/>
		<!--		<xsl:message>
			<xsl:value-of select="$total"/>
		</xsl:message>-->
		<xsl:choose>
			<xsl:when test="$total = 1">
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$pos"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:blank-if-1-variant2">
		<xsl:param name="pos"/>
		<xsl:param name="total"/>
		<xsl:choose>
			<xsl:when test="$pos = 1">
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="concat('[', $pos, ']')"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:action-code">
		<xsl:param name="code"/>
		<xsl:choose>
			<xsl:when test="$code = 'A'">
				<xsl:value-of select="'Add'"/>
			</xsl:when>
			<xsl:when test="$code = 'D'">
				<xsl:value-of select="'Delete'"/>
			</xsl:when>
			<xsl:when test="$code = 'U'">
				<xsl:value-of select="'Update'"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$code"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:admin-sex">
		<xsl:param name="code"/>
		<xsl:choose>
			<xsl:when test="$code = 'F'">
				<xsl:value-of select="'Female'"/>
			</xsl:when>
			<xsl:when test="$code = 'M'">
				<xsl:value-of select="'Male'"/>
			</xsl:when>
			<xsl:when test="$code = 'U'">
				<xsl:value-of select="'Unknown/undifferentiated'"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$code"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:protection-indicator">
		<xsl:param name="code"/>
		<xsl:choose>
			<xsl:when test="$code = 'N'">
				<xsl:value-of select="'No'"/>
			</xsl:when>
			<xsl:when test="$code = 'Y'">
				<xsl:value-of select="'Yes'"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$code"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:IfEmptyThenElse">
		<xsl:param name="data"/>
		<xsl:param name="ifData"/>
		<xsl:param name="ifNotData"/>
		<xsl:choose>
			<xsl:when test="normalize-space($data) = ''">
				<xsl:value-of select="$ifData"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$ifNotData"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:IfThenElse">
		<xsl:param name="cond" as="xs:boolean"/>
		<xsl:param name="ifData"/>
		<xsl:param name="ifNotData"/>
		<xsl:choose>
			<xsl:when test="$cond">
				<xsl:value-of select="$ifData"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$ifNotData"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:valueset2">
		<xsl:param name="key"/>
		<xsl:param name="table"/>
		<xsl:value-of select="$table/t[@c=$key]/@d"/>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:union">
		<xsl:param name="table1"/>
		<xsl:param name="table2"/>
		<xsl:value-of select="$table1 | $table2"/>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:strip-tabsets">
		<xsl:param name="html"/>
		<xsl:variable name="pass1" select="replace($html, 'tab heading=&quot;([^&quot;]*)&quot; *heading2=&quot;([^&quot;]*)&quot; *vertical=&quot;false&quot;', 'fieldset&gt; &lt;legend&gt; $1 &lt;/legend')"/>
		<xsl:variable name="pass2" select="replace($pass1, '/tab&gt;', '/fieldset&gt;')"/>
		<xsl:variable name="pass3" select="replace($pass2, 'span class=&quot;accordion-heading pull-left&quot;', 'span')"/>
		<xsl:variable name="pass4" select="replace($pass3, 'i class=&quot;pull-left fa&quot; ng-', 'i ')"/>
		<xsl:variable name="pass5" select="replace($pass4, 'accordion-heading', 'legend')"/>
		<xsl:value-of select="replace(replace($pass5, '(&lt;tab heading=&quot;.*&quot;)|(&lt;tabset)|(&lt;accordion((-group)|(-heading))?)', '&lt;diV'),                     '(&lt;/tab&gt;)|(&lt;/tabset&gt;)|(&lt;/accordion((-group)|(-heading))?&gt;)', '&lt;/div&gt;')"/>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:strip-tabsets2">
		<xsl:param name="html"/>
		<xsl:variable name="isOpenVar" select="'xslfulltab$2'"/>
		<xsl:variable name="vertical-orientation" select="true()"/>
		<xsl:variable name="accordion-block">
			<xsl:value-of select="util:tag(concat(util:IfThenElse($vertical-orientation,                  concat('accordion-group class=&quot;panel-info&quot; type=&quot;pills&quot; style=&quot;margin-top:0;border: 1px ridge  #C6DEFF;&quot; is-open=&quot;', $isOpenVar, '&quot; '), 'tab'),                  util:IfThenElse($vertical-orientation, '', concat(' heading=&quot;', '$1', '&quot; ')), ' vertical=&quot;', $vertical-orientation, '&quot;'), '')"/>
			<xsl:value-of select="util:tag('accordion-heading', '')"/>
			<xsl:value-of select="util:tag('span class=&quot;clearfix&quot;', '')"/>
			<xsl:value-of select="util:tag('span class=&quot;accordion-heading pull-left&quot;', '')"/>
			<xsl:value-of select="util:tag(concat('i class=&quot;pull-left fa&quot; ng-class=&quot;{''fa-caret-down'': ', $isOpenVar, ', ''fa-caret-right'': !', $isOpenVar, '}&quot;'), '')"/>
			<xsl:value-of select="util:tag('/i', '')"/>
			<xsl:value-of select="'$2'"/>
			<xsl:value-of select="util:tag('/span', '')"/>
			<xsl:value-of select="util:tag('/span', '')"/>
			<xsl:value-of select="util:tag('/accordion-heading', '')"/>
		</xsl:variable>
		<xsl:variable name="pass1" select="replace($html, '&lt;tab heading=&quot;([^&quot;]*)&quot; *heading2=&quot;([^&quot;]*)&quot; *vertical=&quot;false&quot;&gt;', $accordion-block)"/>
		<xsl:variable name="pass2" select="replace($pass1, '/tab&gt;', '/accordion-group&gt;')"/>
		<xs:value-of select="$pass2"/>
		<xsl:value-of select="$pass2"/>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:segdesc">
		<xsl:param name="seg"/>
		<xsl:choose>
			<xsl:when test="$seg = 'PID' or $seg = 'QPD'">
				<xsl:value-of select="'Patient Information'"/>
			</xsl:when>
			<xsl:when test="$seg = 'PD1'">
				<xsl:value-of select="'Immunization Registry Information'"/>
			</xsl:when>
			<xsl:when test="$seg = 'PV1'">
				<xsl:value-of select="'Patient Visit Information'"/>
			</xsl:when>
			<xsl:when test="$seg = 'NK1'">
				<xsl:value-of select="'Guardian or Responsible Party'"/>
			</xsl:when>
			<xsl:when test="$seg = 'OBX'">
				<xsl:value-of select="'Observations'"/>
			</xsl:when>
			<xsl:when test="$seg = 'RXA'">
				<xsl:value-of select="'Vaccine Administration Information'"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="'Other'"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:completion-status">
		<xsl:param name="status"/>
		<xsl:choose>
			<xsl:when test="$status = 'CP'">
				<xsl:value-of select="'Complete'"/>
			</xsl:when>
			<xsl:when test="$status = 'NA'">
				<xsl:value-of select="'Not Administered'"/>
			</xsl:when>
			<xsl:when test="$status = 'PA'">
				<xsl:value-of select="'Partially Administered'"/>
			</xsl:when>
			<xsl:when test="$status = 'RE'">
				<xsl:value-of select="'Refused'"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$status"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:imm-reg-status">
		<xsl:param name="status"/>
		<xsl:choose>
			<xsl:when test="$status = 'A'">
				<xsl:value-of select="'Active'"/>
			</xsl:when>
			<xsl:when test="$status = 'I'">
				<xsl:value-of select="'Inactive'"/>
			</xsl:when>
			<xsl:when test="$status = 'L'">
				<xsl:value-of select="'Inactive-Lost to follow-up (cannot contact)'"/>
			</xsl:when>
			<xsl:when test="$status = 'M'">
				<xsl:value-of select="'Inactive-Lost to follow-up (cannot contact)'"/>
			</xsl:when>
			<xsl:when test="$status = 'P'">
				<xsl:value-of select="'Inactive-Permanently inactive (do not re-activate or add new entries to this record)'"/>
			</xsl:when>
			<xsl:when test="$status = 'U'">
				<xsl:value-of select="'Unknown'"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$status"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:sub-refusal-reason">
		<xsl:param name="status"/>
		<xsl:choose>
			<xsl:when test="$status = '00'">
				<xsl:value-of select="'Parental decision'"/>
			</xsl:when>
			<xsl:when test="$status = '01'">
				<xsl:value-of select="'Religious exemption'"/>
			</xsl:when>
			<xsl:when test="$status = '02'">
				<xsl:value-of select="'Other'"/>
			</xsl:when>
			<xsl:when test="$status = '03'">
				<xsl:value-of select="'Patient decision'"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$status"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:yes-no">
		<xsl:param name="val"/>
		<xsl:choose>
			<xsl:when test="$val = '1' or $val = 'y' or $val = 'Y'">
				<xsl:value-of select="'Yes'"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="'No'"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:or5">
		<xsl:param name="val1"/>
		<xsl:param name="val2"/>
		<xsl:param name="val3"/>
		<xsl:param name="val4"/>
		<xsl:param name="val5"/>
		<xsl:choose>
			<xsl:when test="normalize-space($val1) != ''">
				<xsl:value-of select="$val1"/>
			</xsl:when>
			<xsl:when test="normalize-space($val2) != ''">
				<xsl:value-of select="$val2"/>
			</xsl:when>
			<xsl:when test="normalize-space($val3) != ''">
				<xsl:value-of select="$val3"/>
			</xsl:when>
			<xsl:when test="normalize-space($val4) != ''">
				<xsl:value-of select="$val4"/>
			</xsl:when>
			<xsl:when test="normalize-space($val5) != ''">
				<xsl:value-of select="$val5"/>
			</xsl:when>
		</xsl:choose>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:element1">
		<xsl:param name="val"/>
		<xsl:param name="ind"/>
		<xsl:choose>
			<xsl:when test="normalize-space($val) = ''">
				<xsl:value-of select="util:tag('td class=''noData''', $ind)"/>
				<xsl:value-of select="$val"/>
				<xsl:value-of select="util:tag('/td', $ind)"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="util:tags('td', $val, $ind)"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:elements9-header">
		<xsl:param name="val1"/>
		<xsl:param name="val2"/>
		<xsl:param name="val3"/>
		<xsl:param name="val4"/>
		<xsl:param name="val5"/>
		<xsl:param name="val6"/>
		<xsl:param name="val7"/>
		<xsl:param name="val8"/>
		<xsl:param name="val9"/>
		<xsl:param name="ind"/>
		<xsl:value-of select="util:elements9($val1, $val2, $val3, $val4, $val5, $val6, $val7, $val8, $val9, ' class=&quot;separator&quot; ', $ind)"/>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:elements9">
		<xsl:param name="val1"/>
		<xsl:param name="val2"/>
		<xsl:param name="val3"/>
		<xsl:param name="val4"/>
		<xsl:param name="val5"/>
		<xsl:param name="val6"/>
		<xsl:param name="val7"/>
		<xsl:param name="val8"/>
		<xsl:param name="val9"/>
		<xsl:param name="tdclass"/>
		<xsl:param name="ind"/>
		<xsl:choose>
			<xsl:when test="$generate-plain-html">
				<xsl:variable name="td-element">
					<xsl:value-of select="util:element1($val1, $ind1)"/>
					<xsl:value-of select="util:element1($val2, $ind1)"/>
					<xsl:value-of select="util:element1($val3, $ind1)"/>
					<xsl:value-of select="util:element1($val4, $ind1)"/>
					<xsl:value-of select="util:element1($val5, $ind1)"/>
					<xsl:value-of select="util:element1($val6, $ind1)"/>
					<xsl:value-of select="util:element1($val7, $ind1)"/>
					<xsl:value-of select="util:element1($val8, $ind1)"/>
					<xsl:value-of select="util:element1($val9, $ind1)"/>
				</xsl:variable>
				<xsl:value-of select="util:tag(concat('tr', $tdclass), $ind)"/>
				<xsl:value-of select="$td-element"/>
				<xsl:value-of select="util:tag('/tr', $ind)"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="concat($nl, $ind, $indent, $indent, '{&quot;val1&quot; : &quot;', $val1, '&quot;, &quot;val2&quot; : &quot;', $val2, '&quot;}', '')"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:function>
	<xsl:function xmlns:xalan="http://xml.apache.org/xslt" name="util:obx-result">
		<xsl:param name="obx"/>
		<xsl:choose>
			<xsl:when test="$obx//OBX.2 = 'SN'">
				<xsl:value-of select="concat(util:format-with-space($obx//OBX.5.1), util:format-with-space($obx//OBX.5.2), util:format-with-space($obx//OBX.5.3), $obx//OBX.5.4)"/>
			</xsl:when>
			<xsl:when test="$obx//OBX.2 = 'TS'">
				<xsl:value-of select="$obx//OBX.5.1"/>
			</xsl:when>
			<xsl:when test="$obx//OBX.2 = 'CWE'">
				<xsl:value-of select="util:or5($obx//OBX.5.9, $obx//OBX.5.2, $obx//OBX.5.5, '', '')"/>
			</xsl:when>
			<xsl:when test="$obx//OBX.2 = 'ED'">
				<xsl:value-of select="$obx//OBX.5.5"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$obx//OBX.5"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:function>
	<xsl:template xmlns:fo="http://www.w3.org/1999/XSL/Format" name="plain-html">
		<xsl:variable name="full">
			<xsl:call-template name="_main"/>
		</xsl:variable>
		<html xmlns="">
			<head>
				<title/>
				<xsl:call-template name="css"/>
			</head>
			<body>
				<div class="test-data-specs-main">
					<xsl:value-of select="util:strip-tabsets($full)"/>
				</div>
			</body>
		</html>
	</xsl:template>
	<xsl:template xmlns:fo="http://www.w3.org/1999/XSL/Format" name="plain-html-message-content">
		<xsl:variable name="full">
			<xsl:call-template name="_main"/>
		</xsl:variable>
		<html xmlns="">
			<head>
				<title/>
				<xsl:call-template name="css"/>
			</head>
			<body>
				<div class="message-content">
					<xsl:value-of select="util:strip-tabsets($full)"/>
				</div>
			</body>
		</html>
	</xsl:template>
	<xsl:template xmlns:fo="http://www.w3.org/1999/XSL/Format" name="ng-tab-html">
		<xsl:call-template name="css"/>
		<xsl:call-template name="main"/>
	</xsl:template>
	<xsl:template xmlns:fo="http://www.w3.org/1999/XSL/Format" name="main-html">
		<html xmlns="">
			<head>
				<xsl:if test="$output = 'jquery-tab-html'">
					<link rel="stylesheet" href="http://code.jquery.com/ui/1.11.4/themes/smoothness/jquery-ui.css"/>
					<script src="http://code.jquery.com/jquery-1.10.2.js"/>
					<script src="http://code.jquery.com/ui/1.11.4/jquery-ui.js"/>
				</xsl:if>
				<xsl:call-template name="css"/>
				<script>
				var data = 
				<xsl:call-template name="main"/>;
				
				var full = '', html = '';
				
				<xsl:if test="$output = 'jquery-tab-html'">
					$(function() { $( "#test-data-tabs" ).tabs();	});
				</xsl:if>
				
				document.write('<div class="test-data-specs-main">');
					
				/* if we wanted to generate the root tab structure include this code
				$(function() { $( "#test-tabs" ).tabs();	});
					
				document.write('<div id="test-tabs">');
				document.write('<ul>');
				document.write('<li>
									<a href="#test-tabs-0">Test Story</a>
								</li>');
				document.write('<li>
									<a href="#test-tabs-1">Test Data Specification</a>
								</li>');
				document.write('<li>
									<a href="#test-tabs-2">Message Content</a>
								</li>');
				document.write('</ul>'); 
				*/
				
				<!-- xsl:call-template name="test-story"></xsl:call-template -->
							<xsl:call-template name="test-data-specs"/>
							<!-- xsl:call-template name="message-content"></xsl:call-template -->
					
				document.write('</div>');	
				document.write('</div>');	
			</script>
			</head>
			<body>
			</body>
		</html>
	</xsl:template>
	<xsl:template xmlns:fo="http://www.w3.org/1999/XSL/Format" name="test-story">
		document.write('<div xmlns="" id="test-tabs-0">');
		document.write(' ............. Test .......... Story................... ');
		document.write('</div>');
	</xsl:template>
	<xsl:template xmlns:fo="http://www.w3.org/1999/XSL/Format" name="message-content">
		document.write('<div xmlns="" id="test-tabs-2">');
		document.write(' ............. Message .......... Content................... ');
		document.write('</div>');
	</xsl:template>
	<xsl:template xmlns:fo="http://www.w3.org/1999/XSL/Format" name="test-data-specs">
		<!-- if jquery-tab-html create full div and a div for each tab; otherwise generate only the FULL div containing all the tables -->
		document.write('<div xmlns="" id="test-tabs-1">');
		document.write('<div id="test-data-tabs">');
			<xsl:if test="$output = 'jquery-tab-html'">
				document.write('<ul>');
				document.write('<li>
							<a href="#test-data-tabs-0">FULL</a>
						</li>');
				for(var key in data.tables) {
					document.write('<li>
							<a href="#test-data-tabs-' + (key+1) + '">' + data.tables[key].title + '</a>
						</li>');
				}	
				document.write('</ul>');
			</xsl:if>
				<!-- each table is under a div test-data-tabs-nn -->
			for(var key in data.tables) {
			    var tab = '';
			    tab += '<div id="test-data-tabs-' + (key+1) + '">';
				var table = data.tables[key];
				tab += ('<fieldset>
						<legend>' + table.title + 
					'</legend>
						<table>
							<tr>
								<th> Element </th>
								<th> Data </th>
							</tr>'); 

				for (var elkey in table.elements) {
					element = table.elements[elkey];
					// display obxs as separate table
					if (element.element == 'obx') {
							var obx = element.data;
							tab += '</table>
					</fieldset>'; // end the bigger table
							tab += ('<fieldset>
						<table>
							<tr>
								<th colspan="2"> ' + obx.title + '</th>
							</tr>'); 
							for (var obxkey in obx.elements) {
								if (obx.elements[obxkey].element == "") { // gray line
									tab += '<tr class="obxGrpSpl">
								<td colspan="2"/>
							</tr>';
								} 						
								else {
									tab += ('<tr>
								<td>' + obx.elements[obxkey].element + '</td>
								<td>' + obx.elements[obxkey].data + '</td>
							</tr>');
								}
							}
					}
					else {
						var tdclass = element.data == '' ? "noData" : "data"; 
						tab += ('<tr>
								<td>' + element.element + '</td>
								<td class="' + tdclass + '">' + element.data + '</td>
							</tr>');
					}
				}
				
				tab += '</table>
					</fieldset>';
				tab += '</div>';

				<!-- output individual tabs only if the output is jquery-tab-html; otherwise collect all of them and output only once -->
				<xsl:if test="$output = 'jquery-tab-html'">
					document.write(tab);
				</xsl:if>
				<!-- full tab is nothing but sum of all other tabs -->
				full += tab; 
			} 					
			
			<!-- full tab: test-data-tabs-0 div -->
			document.write('<div id="test-data-tabs-0"> ' + full + '</div>');
			document.write('</div>');
			document.write('</div>'); 
	</xsl:template>
	<xsl:template xmlns:fo="http://www.w3.org/1999/XSL/Format" name="css">
		<style xmlns="" type="text/css">
			@media screen {
			.test-data-specs-main legend {text-align:center;font-size:110%; font-weight:bold;}					
			.test-data-specs-main .nav-tabs {font-weight:bold;}					
			.test-data-specs-main .tds_obxGrpSpl {background:#B8B8B8;}
			.test-data-specs-main maskByMediaType {display:table;}
			.test-data-specs-main table tbody tr th {font-size:95%}
			.test-data-specs-main table tbody tr td {font-size:100%;}
			.test-data-specs-main table tbody tr th {text-align:left;background:#C6DEFF}
			.test-data-specs-main table thead tr th {text-align:center;}
			.test-data-specs-main fieldset {text-align:center;}
			.test-data-specs-main table { width:98%;border: 1px groove;table-layout: fixed; margin:0 auto;border-collapse: collapse;}
			.test-data-specs-main table  tr { border: 3px groove; }
			.test-data-specs-main table  th { border: 2px groove;}
			.test-data-specs-main table  td { border: 2px groove; }
			.test-data-specs-main table thead {border: 1px groove;background:#446BEC;text-align:left;}
			.test-data-specs-main .separator {background:rgb(240, 240, 255); text-align:left;}
			.test-data-specs-main table tbody tr td {text-align:left}
			.test-data-specs-main .noData {background:#B8B8B8;}
			.test-data-specs-main .childField {background:#B8B8B8;}
			.test-data-specs-main .title {text-align:left;}
			.test-data-specs-main h3 {text-align:center;page-break-inside: avoid;}
			.test-data-specs-main h2 {text-align:center;}
			.test-data-specs-main h1 {text-align:center;}
			.test-data-specs-main .pgBrk {padding-top:15px;}
			.test-data-specs-main .er7Msg {width:100%;}
			.test-data-specs-main .embSpace {padding-left:15px;}			
			.test-data-specs-main .accordion-heading { font-weight:bold; font-size:90%;}										
			.test-data-specs-main .accordion-heading i.fa:after { content: "\00a0 "; }									
			.test-data-specs-main  panel { margin: 10px 5px 5px 5px; }
			}
			
			@media print {
			.test-data-specs-main legend {text-align:center;font-size:110%; font-weight:bold;}					
			.test-data-specs-main .nav-tabs {font-weight:bold;}					
			.test-data-specs-main .obxGrpSpl {background:#B8B8B8;}
			.test-data-specs-main maskByMediaType {display:table;}
			.test-data-specs-main table tbody tr th {font-size:90%}
			.test-data-specs-main table tbody tr td {font-size:90%;}
			.test-data-specs-main table tbody tr th {text-align:left;background:#C6DEFF}
			.test-data-specs-main table thead tr th {text-align:center;background:#4682B4}
			.test-data-specs-main fieldset {text-align:center;page-break-inside: avoid;}
			.test-data-specs-main table { width:98%;border: 1px groove;table-layout: fixed; margin:0 auto;page-break-inside: avoid;border-collapse: collapse;}
			.test-data-specs-main table[id=vendor-labResults] thead tr {font-size:80%}
			.test-data-specs-main table[id=vendor-labResults] tbody tr {font-size:75%}
			.test-data-specs-main table  tr { border: 3px groove; }
			.test-data-specs-main table  th { border: 2px groove;}
			.test-data-specs-main table  td { border: 2px groove; }
			.test-data-specs-main table thead {border: 1px groove;background:#446BEC;text-align:left;}
			.test-data-specs-main .separator {background:rgb(240, 240, 255); text-align:left;}
			.test-data-specs-main table tbody tr td {text-align:left;}
			.test-data-specs-main .noData {background:#B8B8B8;}
			.test-data-specs-main .childField {background:#B8B8B8;}
			.test-data-specs-main .tds_title {text-align:left;margin-bottom:1%}
			.test-data-specs-main h3 {text-align:center;}
			.test-data-specs-main h2 {text-align:center;}
			.test-data-specs-main h1 {text-align:center;}
			.test-data-specs-main .tds_pgBrk {page-break-after:always;}
			.test-data-specs-main #er7Message table {border:0px;width:80%}
			.test-data-specs-main #er7Message td {background:#B8B8B8;font-size:65%;margin-top:6.0pt;border:0px;text-wrap:preserve-breaks;white-space:pre;}
			.test-data-specs-main .er7Msg {width:100%;font-size:80%;}
			.test-data-specs-main .er7MsgNote{width:100%;font-style:italic;font-size:80%;}
			.test-data-specs-main .embSpace {padding-left:15px;}
			.test-data-specs-main .embSubSpace {padding-left:25px;}
			.test-data-specs-main .accordion-heading { font-weight:bold; font-size:90%; }										
			.test-data-specs-main .accordion-heading i.fa:after { content: "\00a0 "; }									
			.test-data-specs-main  panel { margin: 10px 5px 5px 5px; }
			}
		</style>
	</xsl:template>
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
	<!-- - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -  - - - - - - - - - - - - -->
</xsl:stylesheet>
