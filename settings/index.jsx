function mySettings(props) {
  return (
    <Page>
      <Section
        title={<Text bold align="center">NOAA Tide Buoy (default 9414290)</Text>}>
        <TextInput
          label="Station ID"
          placeholder="9414290"
          title="Text Input"
          settingsKey="textInput"
        />
      </Section>
      <Section
        title={<Text bold align="center">Find your buoy here:</Text>}>
        <Link source="https://tidesandcurrents.noaa.gov/map/">NOAA tides and currents map</Link>
              <Text>This hyperlink will take you to the NOAA website, where you can select tide and current buoys accessible through the CO-OPS API. Note that the selected station must report water levels, or water levels and meteorology. Current stations or meteorology only stations do not provide data necessary for tide clock to work.</Text>
      </Section>
    </Page>
  );
}

registerSettingsPage(mySettings);